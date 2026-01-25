// const express = require("express");
// const router = express.Router();
// const bulkUploadController = require("../controllers/bulkUploadController");
// const { multerSingle, handleUploadErrors } = require("../middleware/uploadMiddleware");

// // Optional: Pre-check for multipart (safe to keep)
// const ensureMultipart = (req, res, next) => {
//   const ct = req.headers["content-type"] || "";
//   if (!ct.startsWith("multipart/") || !ct.includes("boundary=")) {
//     return res.status(400).json({
//       message: "Invalid Content-Type: expected multipart/form-data with boundary",
//     });
//   }
//   next();
// };

// router.post(
//   "/upload",
//   ensureMultipart,
//   multerSingle,        
//   handleUploadErrors,  
//   bulkUploadController.uploadFile 
// );

// module.exports = router;

const express = require("express");
const router = express.Router();

const bulkUploadController = require("../controllers/bulkUploadController");
const {
  multerSingle,
  handleUploadErrors,
} = require("../models/bulkuploadModel");

/* =====================================================
   OPTIONAL SAFETY CHECK (KEEP OR REMOVE)
===================================================== */
const ensureMultipart = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (
    !contentType.startsWith("multipart/form-data") ||
    !contentType.includes("boundary=")
  ) {
    return res.status(400).json({
      message:
        "Invalid Content-Type. Expected multipart/form-data with boundary.",
    });
  }
  next();
};

/* =====================================================
   ROUTE
===================================================== */
router.post(
  "/upload",
  ensureMultipart,      // optional but safe
  multerSingle,         // handles file upload
  handleUploadErrors,   // multer errors
  bulkUploadController.uploadFile
);

module.exports = router;



//modification




