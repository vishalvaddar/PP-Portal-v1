const express = require('express');
const multer = require('multer');
const bulkUploadController = require('../controllers/bulkUploadController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const upload = multer({ storage });
router.post('/', upload.single('file'), bulkUploadController.uploadFile);

module.exports = router;
