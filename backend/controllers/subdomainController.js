const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const unzipper = require("unzipper");
const MAIN_DOMAIN = process.env.MAIN_DOMAIN;

// Get sites directory - go up from controllers folder to project root
const getSitesDir = () => {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.RENDER;

  if (isProduction) {
    // Production: use process.cwd() which will be the project root
    return path.join(process.cwd(), "sites");
  }

  // Local: go up two levels from controllers folder to project root
  // controllers is at: backend/controllers/
  // sites is at: sites/
  return path.join(__dirname, "..", "..", "sites");
};

// Get passwords file path
const getPasswordsFile = () => {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.RENDER;

  if (isProduction) {
    return path.join(process.cwd(), "passwords.json");
  }

  return path.join(__dirname, "..", "..", "passwords.json");
};

// Simple hash function for passwords
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// Load passwords from file
const loadPasswords = () => {
  const passwordsFile = getPasswordsFile();
  try {
    if (fs.existsSync(passwordsFile)) {
      const data = fs.readFileSync(passwordsFile, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error loading passwords:", e);
  }
  return {};
};

// Save passwords to file
const savePasswords = (passwords) => {
  const passwordsFile = getPasswordsFile();
  try {
    fs.writeFileSync(passwordsFile, JSON.stringify(passwords, null, 2), "utf8");
  } catch (e) {
    console.error("Error saving passwords:", e);
  }
};

// Verify password for subdomain
const verifyPassword = (subdomain, password) => {
  const passwords = loadPasswords();
  const hashed = hashPassword(password);
  return passwords[subdomain] === hashed;
};

// Ensure sites directory exists
const ensureSitesDir = () => {
  const sitesDir = getSitesDir();
  if (!fs.existsSync(sitesDir)) {
    fs.mkdirSync(sitesDir, { recursive: true });
  }
  return sitesDir;
};

// Generate default HTML content - deployed website style
const generateDefaultHTML = (subdomain) => {
  const fullUrl = `https://${subdomain}.${MAIN_DOMAIN}`;
  const manageUrl = `https://${MAIN_DOMAIN}/manage.html?subdomain=${subdomain}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subdomain} - Deployed on ${MAIN_DOMAIN}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0a0a0a;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        header {
            padding: 20px 40px;
            border-bottom: 1px solid #1f1f1f;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .logo {
            font-size: 1.1rem;
            font-weight: 600;
            color: #fff;
        }
        .logo span {
            color: #22c55e;
        }
        .manage-btn {
            background: #171717;
            color: #a3a3a3;
            border: 1px solid #262626;
            padding: 8px 16px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .manage-btn:hover {
            background: #262626;
            color: #fff;
        }
        main {
            flex: 1;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 20px;
        }
        .hero {
            text-align: center;
            max-width: 600px;
        }
        .badge {
            display: inline-block;
            background: rgba(34, 197, 94, 0.1);
            color: #22c55e;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
            margin-bottom: 24px;
        }
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #fff;
            margin-bottom: 16px;
            line-height: 1.2;
        }
        .subtitle {
            font-size: 1.1rem;
            color: #737373;
            margin-bottom: 32px;
            line-height: 1.6;
        }
        .url-box {
            display: inline-flex;
            align-items: center;
            background: #141414;
            border: 1px solid #262626;
            border-radius: 10px;
            padding: 12px 16px;
            gap: 12px;
        }
        .url-box a {
            color: #22c55e;
            text-decoration: none;
            font-family: monospace;
            font-size: 0.95rem;
        }
        .url-box a:hover {
            text-decoration: underline;
        }
        .copy-btn {
            background: #262626;
            border: none;
            color: #737373;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
        }
        .copy-btn:hover {
            background: #333;
            color: #fff;
        }
        .action-box {
            margin-top: 32px;
            padding: 20px;
            background: #141414;
            border: 1px solid #262626;
            border-radius: 12px;
        }
        .action-box p {
            color: #a3a3a3;
            font-size: 0.9rem;
            margin-bottom: 16px;
        }
        .upload-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #22c55e;
            color: #000;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
        }
        .upload-btn:hover {
            background: #16a34a;
        }
        footer {
            padding: 20px 40px;
            border-top: 1px solid #1f1f1f;
            text-align: center;
            color: #525252;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <header>
        <div class="logo">${MAIN_DOMAIN}</div>
        <a href="https://${MAIN_DOMAIN}/manage.html?subdomain=${subdomain}" class="manage-btn">
            ⚙️ Manage
        </a>
    </header>
    <main>
        <div class="hero">
            <div class="badge">✓ Live</div>
            <h1>Your site is deployed</h1>
            <p class="subtitle">
                <strong>${subdomain}.${MAIN_DOMAIN}</strong> is now live and ready to serve your content.
            </p>
            <div class="url-box">
                <a href="${fullUrl}" id="url">${fullUrl}</a>
                <button class="copy-btn" onclick="copyUrl()">Copy</button>
            </div>
            <div class="action-box">
                <p>Want to update your site? Upload new files here:</p>
                <a href="https://${MAIN_DOMAIN}/manage.html?subdomain=${subdomain}" class="upload-btn">
                    📁 Upload New Files
                </a>
            </div>
        </div>
    </main>
    <footer>
        Powered by ${MAIN_DOMAIN}
    </footer>
    <script>
        function copyUrl() {
            const url = document.getElementById('url').textContent;
            navigator.clipboard.writeText(url);
            const btn = document.querySelector('.copy-btn');
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = 'Copy', 2000);
        }
    </script>
</body>
</html>`;
};

// Create subdomain (with optional ZIP file and password)
exports.createSubdomain = (req, res) => {
  const { subdomain, password } = req.body;
  const uploadedFile = req.file;

  // Validate subdomain parameter
  if (!subdomain) {
    return res.status(400).json({
      success: false,
      error: "Subdomain name is required",
    });
  }

  // Validate password
  if (!password || password.length < 4) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 4 characters",
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

    // Save password
    const passwords = loadPasswords();
    passwords[cleanSubdomain] = hashPassword(password);
    savePasswords(passwords);

    // If a ZIP file was uploaded, extract it
    if (uploadedFile) {
      const zipPath = uploadedFile.path;

      fs.createReadStream(zipPath)
        .pipe(unzipper.Parse())
        .on("entry", function (entry) {
          const fileName = entry.path;

          // Get only the filename (last part of the path)
          // This prevents nested folders from ZIP structure
          const baseName = path.basename(fileName);

          // Skip directories and hidden files
          if (!baseName || baseName.startsWith(".")) {
            entry.autodrain();
            return;
          }

          const absolutePath = path.join(subdomainPath, baseName);

          // Prevent path traversal attacks
          if (
            !baseName ||
            baseName.includes("..") ||
            baseName.startsWith("/")
          ) {
            entry.autodrain();
            return;
          }

          // Write file directly to subdomain folder
          entry.pipe(fs.createWriteStream(absolutePath));
        })
        .on("close", () => {
          // Clean up uploaded ZIP file
          try {
            fs.unlinkSync(zipPath);
          } catch (e) {
            console.error("Error cleaning up ZIP file:", e);
          }

          // Check if index.html exists, if not create default
          const indexPath = path.join(subdomainPath, "index.html");
          if (!fs.existsSync(indexPath)) {
            const htmlContent = generateDefaultHTML(cleanSubdomain);
            fs.writeFileSync(indexPath, htmlContent, "utf8");
          }

          const fullUrl = `https://${cleanSubdomain}.${MAIN_DOMAIN}`;

          res.status(201).json({
            success: true,
            subdomain: cleanSubdomain,
            url: fullUrl,
          });
        })
        .on("error", (err) => {
          console.error("Error extracting ZIP:", err);
          // Clean up uploaded file and subdomain folder
          try {
            fs.unlinkSync(zipPath);
            fs.rmSync(subdomainPath, { recursive: true, force: true });
          } catch (e) {
            // Ignore cleanup errors
          }
          res.status(500).json({
            success: false,
            error: "Failed to extract ZIP file",
          });
        });
    } else {
      // No ZIP file - generate default index.html
      const htmlContent = generateDefaultHTML(cleanSubdomain);
      const indexPath = path.join(subdomainPath, "index.html");
      fs.writeFileSync(indexPath, htmlContent, "utf8");

      const fullUrl = `https://${cleanSubdomain}.${MAIN_DOMAIN}`;

      res.status(201).json({
        success: true,
        subdomain: cleanSubdomain,
        url: fullUrl,
      });
    }
  } catch (error) {
    console.error("Error creating subdomain:", error);
    // Clean up on error
    try {
      fs.rmSync(subdomainPath, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
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
  if (name == "new") {
    return res.status(403).json({
      available: false,
      error: "Subdomain name is not Available",
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

// Upload and extract ZIP file for subdomain (requires password)
exports.uploadSubdomain = (req, res) => {
  const { subdomain, password } = req.body;

  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No ZIP file uploaded",
    });
  }

  // Check if subdomain was provided
  if (!subdomain) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      error: "Subdomain name is required",
    });
  }

  // Check if password was provided
  if (!password) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      error: "Password is required",
    });
  }

  // Validate subdomain
  const cleanSubdomain = subdomain.toLowerCase().trim();

  if (cleanSubdomain.length < 3 || cleanSubdomain.length > 30) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      error: "Subdomain must be between 3 and 30 characters",
    });
  }

  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(cleanSubdomain)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      error: "Only lowercase letters, numbers, and hyphens allowed",
    });
  }

  if (cleanSubdomain.startsWith("-") || cleanSubdomain.endsWith("-")) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      error: "Cannot start or end with hyphen",
    });
  }

  const sitesDir = ensureSitesDir();
  const subdomainPath = path.join(sitesDir, cleanSubdomain);

  // Check if subdomain exists
  if (!fs.existsSync(subdomainPath)) {
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    return res.status(404).json({
      success: false,
      error: "Subdomain does not exist. Create it first.",
    });
  }

  // Verify password
  if (!verifyPassword(cleanSubdomain, password)) {
    fs.unlinkSync(req.file.path);
    return res.status(401).json({
      success: false,
      error: "Invalid password",
    });
  }

  // Extract ZIP file
  const zipPath = req.file.path;

  fs.createReadStream(zipPath)
    .pipe(unzipper.Parse())
    .on("entry", function (entry) {
      const fileName = entry.path;

      // Get only the filename (last part of the path)
      // This prevents nested folders from ZIP structure
      const baseName = path.basename(fileName);

      // Skip directories and hidden files
      if (!baseName || baseName.startsWith(".")) {
        entry.autodrain();
        return;
      }

      const absolutePath = path.join(subdomainPath, baseName);

      // Prevent path traversal attacks
      if (!baseName || baseName.includes("..") || baseName.startsWith("/")) {
        entry.autodrain();
        return;
      }

      // Write file directly to subdomain folder
      entry.pipe(fs.createWriteStream(absolutePath));
    })
    .on("close", () => {
      // Clean up uploaded ZIP file
      try {
        fs.unlinkSync(zipPath);
      } catch (e) {
        console.error("Error cleaning up ZIP file:", e);
      }

      // Check if index.html exists, if not create default
      const indexPath = path.join(subdomainPath, "index.html");
      if (!fs.existsSync(indexPath)) {
        const htmlContent = generateDefaultHTML(cleanSubdomain);
        fs.writeFileSync(indexPath, htmlContent, "utf8");
      }

      const fullUrl = `https://${cleanSubdomain}.${MAIN_DOMAIN}`;

      res.json({
        success: true,
        message: "Files uploaded and extracted successfully",
        subdomain: cleanSubdomain,
        url: fullUrl,
      });
    })
    .on("error", (err) => {
      console.error("Error extracting ZIP:", err);
      // Clean up uploaded file
      try {
        fs.unlinkSync(zipPath);
      } catch (e) {
        // Ignore cleanup errors
      }
      res.status(500).json({
        success: false,
        error: "Failed to extract ZIP file",
      });
    });
};
