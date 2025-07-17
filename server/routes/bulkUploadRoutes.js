const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bulkUploadController = require('../controllers/bulkUploadController');

const router = express.Router();

// Ensure the uploads folder exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  allowedTypes.includes(file.mimetype)
    ? cb(null, true)
    : cb(new Error('Only CSV and Excel files are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

router.post('/', upload.single('file'), bulkUploadController.uploadFile);
router.get('/logs/:logFileName', bulkUploadController.downloadLogFile);

module.exports = router;
