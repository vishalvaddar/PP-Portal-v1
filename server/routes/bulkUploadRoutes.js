const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { uploadFile } = require("../controllers/bulkUploadController");

const router = express.Router();

router.post("/upload", upload.single("file"), uploadFile);

module.exports = router;
