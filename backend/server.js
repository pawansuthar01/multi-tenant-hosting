const express = require("express");
const bodyParser = require("express").json;
const path = require("path");

// Import routes
const subdomainRoutes = require("./routes/subdomain");

// Import middleware
const subdomainMiddleware = require("./middleware/subdomain");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser());

// Serve static files from public directory (main UI)
app.use(express.static(path.join(__dirname, "../public")));

// Subdomain routing middleware - MUST be before routes
// This catches all subdomain requests and serves the appropriate folder
app.use(subdomainMiddleware);

// API Routes
app.use("/api/subdomain", subdomainRoutes);

// Serve main domain index
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Main domain: http://localhost:${PORT}`);
  console.log(`Sites directory: ${path.join(process.cwd(), "sites")}`);
});
