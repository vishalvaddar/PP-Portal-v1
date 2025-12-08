const express = require("express");
const router = express.Router();
const bulkUploadController = require("../controllers/bulkUploadController");
const { multerSingle, handleUploadErrors } = require("../middleware/uploadMiddleware");

// Optional: Pre-check for multipart (safe to keep)
const ensureMultipart = (req, res, next) => {
  const ct = req.headers["content-type"] || "";
  if (!ct.startsWith("multipart/") || !ct.includes("boundary=")) {
    return res.status(400).json({
      message: "Invalid Content-Type: expected multipart/form-data with boundary",
    });
  }
  next();
};

router.post(
  "/upload",
  ensureMultipart,
  multerSingle,        
  handleUploadErrors,  
  bulkUploadController.uploadFile 
);

module.exports = router;
