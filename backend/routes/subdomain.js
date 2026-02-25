const express = require("express");
const router = express.Router();
const subdomainController = require("../controllers/subdomainController");

// Validation middleware
const validateSubdomain = (req, res, next) => {
  const { subdomain } = req.body;

  // Check if subdomain is provided
  if (!subdomain) {
    return res.status(400).json({
      success: false,
      message: "Subdomain name is required",
    });
  }

  // Length check (3-30 characters)
  if (subdomain.length < 3 || subdomain.length > 30) {
    return res.status(400).json({
      success: false,
      message: "Subdomain must be between 3 and 30 characters",
    });
  }

  // Only letters, numbers, and hyphens allowed
  const validPattern = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;
  if (!validPattern.test(subdomain)) {
    return res.status(400).json({
      success: false,
      message:
        "Only letters, numbers, and hyphens allowed. No spaces or special characters.",
    });
  }

  // Check for consecutive hyphens
  if (subdomain.includes("--")) {
    return res.status(400).json({
      success: false,
      message: "Cannot use consecutive hyphens",
    });
  }

  // Check if starts or ends with hyphen
  if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
    return res.status(400).json({
      success: false,
      message: "Cannot start or end with hyphen",
    });
  }

  next();
};

// Create subdomain
router.post("/create", validateSubdomain, subdomainController.createSubdomain);

// Check subdomain availability
router.get("/check/:subdomain", subdomainController.checkAvailability);

// List all subdomains
router.get("/list", subdomainController.listSubdomains);

module.exports = router;
