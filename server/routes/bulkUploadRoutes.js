const express = require('express');
const multer = require('multer');
const bulkUploadController = require('../controllers/bulkUploadController');

const router = express.Router();

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// Define the route for uploading a file
router.post('/', upload.single('file'), bulkUploadController.uploadFile);

module.exports = router;