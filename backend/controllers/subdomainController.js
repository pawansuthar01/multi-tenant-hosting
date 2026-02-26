const fs = require("fs");
const path = require("path");

const MAIN_DOMAIN = "globetrekker.site";

// Use process.cwd() for Render compatibility
// For local dev (npm start from backend folder), go up one level to project root
const getSitesDir = () => {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.RENDER;
  if (isProduction) {
    return path.join(process.cwd(), "sites");
  }
  // Local: sites is at project root (one level up from backend)
  return path.join(process.cwd(), "..", "sites");
};

// Ensure sites directory exists
const ensureSitesDir = () => {
  const sitesDir = getSitesDir();
  if (!fs.existsSync(sitesDir)) {
    fs.mkdirSync(sitesDir, { recursive: true });
  }
  return sitesDir;
};

// Generate default HTML content
const generateDefaultHTML = (subdomain) => {
  const fullUrl = `https://${subdomain}.${MAIN_DOMAIN}`;

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            text-align: center;
            color: white;
            padding: 60px 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
        .subdomain-name {
            font-size: 3.5rem;
            font-weight: bold;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            margin: 20px 0;
            word-break: break-all;
        }
        p {
            font-size: 1.1rem;
            line-height: 1.6;
            opacity: 0.9;
            margin-bottom: 15px;
        }
        .badge {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            padding: 12px 24px;
            border-radius: 50px;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        .url-box {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
        }
        .url {
            font-family: 'Courier New', monospace;
            font-size: 1.2rem;
            word-break: break-all;
        }
        .url a {
            color: #00d4ff;
            text-decoration: none;
        }
        .url a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Welcome to your new subdomain!</h1>
        <div class="subdomain-name">${subdomain}</div>
        <p>Your subdomain has been successfully created and is now live.</p>
        <div class="badge">🚀 Deployed on ${MAIN_DOMAIN}</div>
        <div class="url-box">
            <div class="url">
                <a href="${fullUrl}">${fullUrl}</a>
            </div>
        </div>
    </div>
</body>
</html>`;
};

// Create subdomain
exports.createSubdomain = (req, res) => {
  const { subdomain } = req.body;

  // Validate subdomain parameter
  if (!subdomain) {
    return res.status(400).json({
      success: false,
      error: "Subdomain name is required",
    });
  }

  // Sanitize: lowercase only
  const cleanSubdomain = subdomain.toLowerCase().trim();

  // Length validation (3-30 chars)
  if (cleanSubdomain.length < 3 || cleanSubdomain.length > 30) {
    return res.status(400).json({
      success: false,
      error: "Subdomain must be between 3 and 30 characters",
    });
  }

  // Only lowercase letters, numbers, hyphens allowed
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(cleanSubdomain)) {
    return res.status(400).json({
      success: false,
      error: "Only lowercase letters, numbers, and hyphens allowed",
    });
  }

  // No leading/trailing hyphen
  if (cleanSubdomain.startsWith("-") || cleanSubdomain.endsWith("-")) {
    return res.status(400).json({
      success: false,
      error: "Cannot start or end with hyphen",
    });
  }

  const sitesDir = ensureSitesDir();
  const subdomainPath = path.join(sitesDir, cleanSubdomain);

  // Check if subdomain already exists
  if (fs.existsSync(subdomainPath)) {
    return res.status(400).json({
      success: false,
      error: "Subdomain already taken",
    });
  }

  try {
    // Create subdomain folder
    fs.mkdirSync(subdomainPath, { recursive: true });

    // Generate and write default index.html
    const htmlContent = generateDefaultHTML(cleanSubdomain);
    const indexPath = path.join(subdomainPath, "index.html");
    fs.writeFileSync(indexPath, htmlContent, "utf8");

    const fullUrl = `https://${cleanSubdomain}.${MAIN_DOMAIN}`;

    res.status(201).json({
      success: true,
      subdomain: cleanSubdomain,
      url: fullUrl,
    });
  } catch (error) {
    console.error("Error creating subdomain:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create subdomain",
    });
  }
};

// Check subdomain availability
exports.checkAvailability = (req, res) => {
  const { name } = req.params;

  if (!name) {
    return res.status(400).json({
      available: false,
      error: "Subdomain name is required",
    });
  }

  const cleanName = name.toLowerCase().trim();
  const sitesDir = ensureSitesDir();
  const subdomainPath = path.join(sitesDir, cleanName);

  const exists = fs.existsSync(subdomainPath);

  res.json({
    available: !exists,
    subdomain: cleanName,
  });
};

// List all subdomains
exports.listSubdomains = (req, res) => {
  try {
    const sitesDir = ensureSitesDir();

    if (!fs.existsSync(sitesDir)) {
      return res.json({
        success: true,
        subdomains: [],
      });
    }

    const folders = fs
      .readdirSync(sitesDir, { withFileTypes: true })
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
      error: "Failed to list subdomains",
    });
  }
};
