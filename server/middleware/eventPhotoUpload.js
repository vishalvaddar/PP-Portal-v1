const multer = require("multer");
const fs = require("fs");
const path = require("path");

const BASE_PHOTO_DIR = path.join(__dirname, "..", "..", "Data", "Event_Photos");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { eventId } = req.params;

    const eventDir = path.join(BASE_PHOTO_DIR, String(eventId));
    fs.mkdirSync(eventDir, { recursive: true });

    cb(null, eventDir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

module.exports = multer({
  storage,
  limits: { files: 4 },
  fileFilter
});
