const express = require("express");
const router = express.Router();
const subdomainController = require("../controllers/subdomainController");

// Multer configuration for file uploads
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for ZIP file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use project root uploads folder
    const uploadDir = path.join(__dirname, "..", "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + ".zip");
  },
});

// File filter - only allow ZIP files
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/zip" ||
    file.mimetype === "application/x-zip-compressed" ||
    file.originalname.endsWith(".zip")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only ZIP files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter,
});

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

// Create subdomain (with optional ZIP file)
router.post(
  "/create",
  upload.single("file"),
  validateSubdomain,
  subdomainController.createSubdomain,
);

// Check subdomain availability
router.get("/check/:subdomain", subdomainController.checkAvailability);

// List all subdomains
router.get("/list", subdomainController.listSubdomains);

// Upload ZIP file for subdomain
router.post(
  "/upload",
  upload.single("file"),
  subdomainController.uploadSubdomain,
);

module.exports = router;
