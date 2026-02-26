const fs = require("fs");
const path = require("path");
require("dotenv").config();
// Get sites directory - go up from middleware folder to project root
const getSitesDir = () => {
  const isProduction =
    process.env.NODE_ENV === "production" || process.env.RENDER;

  if (isProduction) {
    return path.join(process.cwd(), "sites");
  }

  // Local: go up two levels from middleware folder to project root
  return path.join(__dirname, "..", "..", "sites");
};

// Main domain - change this to your actual domain
const MAIN_DOMAIN = process.env.MAIN_DOMAIN;

// Generate 404 page - blover style
const generate404Page = (subdomain) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Not Found</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0d0d0d;
            color: #e5e5e5;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        .navbar {
            padding: 24px 48px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .logo {
            font-size: 1.25rem;
            font-weight: 700;
            color: #fff;
            letter-spacing: -0.5px;
        }
        .logo-accent {
            color: #10b981;
        }
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 24px;
        }
        .error-code {
            font-size: 8rem;
            font-weight: 800;
            line-height: 1;
            color: #262626;
            margin-bottom: 16px;
        }
        .error-code span {
            color: #10b981;
        }
        h1 {
            font-size: 2rem;
            font-weight: 600;
            color: #fff;
            margin-bottom: 12px;
        }
        .message {
            font-size: 1rem;
            color: #737373;
            max-width: 400px;
            line-height: 1.6;
            margin-bottom: 32px;
        }
        .subdomain-badge {
            display: inline-block;
            background: #171717;
            color: #10b981;
            padding: 8px 16px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.9rem;
            margin-bottom: 24px;
        }
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #10b981;
            color: #000;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.2s;
        }
        .btn:hover {
            background: #059669;
            transform: translateY(-1px);
        }
        .footer {
            padding: 24px 48px;
            border-top: 1px solid #171717;
            text-align: center;
            color: #404040;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="logo">globetrekker<span class="logo-accent">.site</span></div>
    </nav>
    <div class="content">
        <div class="error-code">4<span>04</span></div>
        <h1>Page not found</h1>
        <p class="message">The subdomain you're looking for doesn't exist or has been moved.</p>
        <div class="subdomain-badge">${subdomain}.globetrekker.site</div>
        <a href="https://globetrekker.site" class="btn">
            Deploy Your Site
        </a>
    </div>
    <footer class="footer">
        Free static hosting by globetrekker.site
    </footer>
</body>
</html>`;
};

module.exports = (req, res, next) => {
  const host = req.headers.host;

  // Skip if no host
  if (!host) {
    return next();
  }

  // Remove port if present
  const hostname = host.split(":")[0];

  // Skip main domain requests
  if (hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`) {
    return next();
  }

  // Skip render default domains
  if (hostname.endsWith(".onrender.com")) {
    return next();
  }

  // Extract subdomain
  let subdomain = hostname;

  if (hostname.endsWith(`.${MAIN_DOMAIN}`)) {
    subdomain = hostname.replace(`.${MAIN_DOMAIN}`, "");
  } else if (hostname.endsWith(".onrender.com")) {
    subdomain = hostname.replace(".onrender.com", "");
  } else if (hostname.includes("localhost")) {
    const cleanHost = hostname.replace(/:\d+$/, "");
    if (cleanHost.endsWith(".localhost")) {
      subdomain = cleanHost.replace(".localhost", "");
    } else if (cleanHost.startsWith("localhost.")) {
      const parts = cleanHost.split(".");
      if (parts.length > 1) {
        subdomain = parts[1];
      }
    } else {
      return next();
    }
  } else {
    // For other domains like domain.com
    const parts = hostname.split(".");
    if (parts.length > 1) {
      subdomain = parts[0];
    } else {
      return next();
    }
  }

  // Validate subdomain format
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 0) {
    return next();
  }

  // Get subdomain path
  const subdomainPath = path.join(getSitesDir(), subdomain);

  // Check if subdomain folder exists
  if (!fs.existsSync(subdomainPath)) {
    // Return 404 page
    return res.status(404).send(generate404Page(subdomain));
  }

  // Get the requested file path
  let requestedPath = req.path;

  // If requesting root, serve index.html
  if (requestedPath === "/" || requestedPath === "") {
    requestedPath = "/index.html";
  }

  const filePath = path.join(subdomainPath, requestedPath);

  // Check if file exists and is within subdomain folder (prevent path traversal)
  const resolvedPath = path.resolve(filePath);
  const resolvedSubdomainPath = path.resolve(subdomainPath);

  if (!resolvedPath.startsWith(resolvedSubdomainPath)) {
    return res.status(403).send("Forbidden");
  }

  if (fs.existsSync(resolvedPath)) {
    if (fs.statSync(resolvedPath).isDirectory()) {
      // If it's a directory, try to serve index.html
      const indexPath = path.join(resolvedPath, "index.html");
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      return res.status(404).send(generate404Page(subdomain));
    }
    // Serve the file
    return res.sendFile(resolvedPath);
  }

  // File not found - return 404
  res.status(404).send(generate404Page(subdomain));
};
