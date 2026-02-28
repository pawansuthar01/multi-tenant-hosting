const express = require("express");
const bodyParser = require("express").json;
const path = require("path");
require("dotenv").config();

// Import routes
const subdomainRoutes = require("./routes/subdomain");

// Import middleware
const subdomainMiddleware = require("./middleware/subdomain");

const app = express();
const PORT = process.env.PORT || 3000;
app.set("trust proxy", 1);
// Middleware
app.use(bodyParser());

// Subdomain routing middleware - MUST be BEFORE static files
// This catches all subdomain requests and serves the appropriate folder
app.use(subdomainMiddleware);

// Serve static files from public directory (main UI)
app.use(express.static(path.join(__dirname, "../public")));

// Serve manage.html
app.get("/manage.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/manage.html"));
});

// API Routes
app.use("/api/subdomain", subdomainRoutes);

// Serve main domain - only for local testing
// Main domain pawansuthar.in is hosted externally
app.get("/", (req, res) => {
  const host = req.headers.host || "";

  // // For localhost or render preview - show deployment page
  // if (host.includes("localhost") || host.includes(".onrender.com")) {
  //   return res.sendFile(path.join(__dirname, "../public/index.html"));
  // }

  // Main domain is handled externally, don't serve anything
  res.status(404).send("Use new.pawansuthar.in to view the deployed site");
});

setInterval(async () => {
  try {
    await axios.get(`${process.env.Backend_URL}/ping`);
  } catch (error) {
    console.error("Error pinging server:", error.message);
  }
}, 15000);

/// routed handel///

app.get("/ping", async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pong..",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "API route not found",
    message: "The requested API endpoint does not exist",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Main domain: http://localhost:${PORT}`);
  console.log(`Sites directory: ${path.join(process.cwd(), "sites")}`);
});
