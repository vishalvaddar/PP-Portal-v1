const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads", "temp");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const allowedMimes = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype) || allowedMimes.some(m => file.mimetype.includes(m))) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only CSV/XLS/XLSX allowed."), false);
  }
};

const limits = {
  fileSize: 25 * 1024 * 1024, // 25 MB
  files: 1,
  fields: 50,
  fieldSize: 1 * 1024 * 1024,
};

const upload = multer({ storage, fileFilter, limits });
const multerSingle = upload.single("file"); // must match client FormData key

const handleUploadErrors = (err, req, res, next) => {
  if (!err) return next();
  console.error("Upload middleware error:", err);
  if (err instanceof multer.MulterError) return res.status(400).json({ message: err.message });
  return res.status(400).json({ message: err.message || "Invalid file upload." });
};

module.exports = { multerSingle, handleUploadErrors };
