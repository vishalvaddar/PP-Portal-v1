const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================================================
  BASE DIRECTORY CONFIGURATION
========================================================= */

const PHOTOS_DIR = process.env.EVENT_STORAGE_PATH
  ? path.resolve(process.env.EVENT_STORAGE_PATH)
  : path.join(__dirname, "..", "uploads", "events", "photos");


/* =========================================================
   ENSURE DIRECTORY EXISTS
========================================================= */

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

ensureDir(PHOTOS_DIR);


/* =========================================================
   MULTER STORAGE CONFIGURATION
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "photos") {
      cb(null, PHOTOS_DIR);
    } else {
      cb(new Error("Invalid upload field"), null);
    }
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname).toLowerCase();

    cb(null, uniqueName);
  }
});


/* =========================================================
   FILE FILTER (IMAGES ONLY)
========================================================= */

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only JPG, PNG, WEBP images are allowed"),
      false
    );
  }
};


/* =========================================================
   UPLOAD MIDDLEWARE
========================================================= */

exports.uploadEventFiles = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).fields([
  { name: "photos", maxCount: 10 }
]);


/* =========================================================
   VALIDATE EVENT BODY
========================================================= */

exports.validateEventBody = (req, res, next) => {
  const {
    event_type_id,
    event_title,
    event_start_date,
    event_end_date
  } = req.body;

  if (!event_type_id || isNaN(event_type_id)) {
    return res.status(400).json({
      message: "Valid event_type_id is required"
    });
  }

  if (!event_title || event_title.trim().length < 3) {
    return res.status(400).json({
      message: "Event title must be at least 3 characters"
    });
  }

  if (!event_start_date || !event_end_date) {
    return res.status(400).json({
      message: "Start and end dates are required"
    });
  }

  if (new Date(event_start_date) > new Date(event_end_date)) {
    return res.status(400).json({
      message: "End date must be after start date"
    });
  }

  next();
};


/* =========================================================
   VALIDATE EVENT ID
========================================================= */

exports.validateEventId = (req, res, next) => {
  const id = Number(req.params.id);

  if (!id || isNaN(id)) {
    return res.status(400).json({
      message: "Invalid event ID"
    });
  }

  req.params.id = id;
  next();
};


/* =========================================================
   SANITIZE NUMBERS
========================================================= */

exports.sanitizeEventNumbers = (req, res, next) => {
  const numericFields = [
    "event_district",
    "event_block",
    "cohort_number",
    "boys_attended",
    "girls_attended",
    "parents_attended",
    "pincode"
  ];

  numericFields.forEach((field) => {
    if (req.body[field] === "" || req.body[field] === undefined) {
      req.body[field] = null;
    } else if (!isNaN(req.body[field])) {
      req.body[field] = Number(req.body[field]);
    }
  });

  next();
};
