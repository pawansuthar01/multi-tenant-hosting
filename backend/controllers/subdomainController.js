const fs = require("fs");
const path = require("path");

const SITES_DIR = path.join(__dirname, "../../sites");
const MAIN_DOMAIN = "pawansuthar.in";

// Ensure sites directory exists
if (!fs.existsSync(SITES_DIR)) {
  fs.mkdirSync(SITES_DIR, { recursive: true });
}

// Generate default HTML content
const generateDefaultHTML = (subdomain) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ${subdomain}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            text-align: center;
            color: white;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 600px;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
        .subdomain-name {
            font-size: 4rem;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            margin: 20px 0;
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            opacity: 0.9;
        }
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 10px 20px;
            border-radius: 50px;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        .url {
            margin-top: 30px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
            font-family: monospace;
            font-size: 1.1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to your new subdomain!</h1>
        <div class="subdomain-name">${subdomain}</div>
        <p>Your subdomain has been successfully created and is now live.</p>
        <div class="badge">🚀 Deployed on ${MAIN_DOMAIN}</div>
        <div class="url">https://${subdomain}.${MAIN_DOMAIN}</div>
    </div>
</body>
</html>`;
};

// Create subdomain
exports.createSubdomain = (req, res) => {
  const { subdomain } = req.body;
  const subdomainPath = path.join(SITES_DIR, subdomain);

  // Check if subdomain already exists
  if (fs.existsSync(subdomainPath)) {
    return res.status(400).json({
      success: false,
      message: "Subdomain already taken. Please choose another name.",
    });
  }

  try {
    // Create subdomain folder
    fs.mkdirSync(subdomainPath, { recursive: true });

    // Generate and write default index.html
    const htmlContent = generateDefaultHTML(subdomain);
    const indexPath = path.join(subdomainPath, "index.html");
    fs.writeFileSync(indexPath, htmlContent, "utf8");

    res.status(201).json({
      success: true,
      message: "Subdomain created successfully!",
      subdomain: subdomain,
      url: `https://${subdomain}.${MAIN_DOMAIN}`,
    });
  } catch (error) {
    console.error("Error creating subdomain:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create subdomain. Please try again.",
    });
  }
};

// Check subdomain availability
exports.checkAvailability = (req, res) => {
  const { subdomain } = req.params;
  const subdomainPath = path.join(SITES_DIR, subdomain);

  const exists = fs.existsSync(subdomainPath);

  res.json({
    subdomain: subdomain,
    available: !exists,
    message: exists ? "Subdomain already taken" : "Subdomain is available",
  });
};

// List all subdomains
exports.listSubdomains = (req, res) => {
  try {
    if (!fs.existsSync(SITES_DIR)) {
      return res.json({ subdomains: [] });
    }

    const folders = fs
      .readdirSync(SITES_DIR, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    res.json({
      success: true,
      subdomains: folders,
      count: folders.length,
    });
  } catch (error) {
    console.error("Error listing subdomains:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list subdomains",
    });
  }
};
