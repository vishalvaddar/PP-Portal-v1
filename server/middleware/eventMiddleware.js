const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================================================
   BASE DIRECTORY CONFIGURATION
   ---------------------------------------------------------
   process.cwd() → Project root
   This ensures files are always stored in:
   server/uploads/events/...
========================================================= */
const DATA_EVENT_DIR = path.join(__dirname, "..", "uploads", "events");
const PHOTOS_DIR = path.join(DATA_EVENT_DIR, "photos");
const REPORTS_DIR = path.join(DATA_EVENT_DIR, "reports");


/* =========================================================
   ENSURE DIRECTORIES EXIST
========================================================= */

const ensureDir = (dirPath) => {
  const resolvedPath = path.resolve(dirPath);

  if (!fs.existsSync(resolvedPath)) {
    fs.mkdirSync(resolvedPath, { recursive: true });
  }
};

ensureDir(PHOTOS_DIR);
ensureDir(REPORTS_DIR);

/* =========================================================
   MULTER STORAGE CONFIGURATION
========================================================= */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "photos") {
      cb(null, PHOTOS_DIR);
    } else if (file.fieldname === "reports") {
      cb(null, REPORTS_DIR);
    } else {
      cb(new Error("Invalid file field"), false);
    }
  },

  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);

    cb(null, `${timestamp}-${random}${ext}`);
  }
});

/* =========================================================
   FILE TYPE VALIDATION
========================================================= */

const fileFilter = (req, file, cb) => {
  const imageMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg"
  ];

  const reportMimeTypes = [
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];

  if (
    file.fieldname === "photos" &&
    imageMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else if (
    file.fieldname === "reports" &&
    reportMimeTypes.includes(file.mimetype)
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

/* =========================================================
   UPLOAD MIDDLEWARE (EXPORT)
========================================================= */

exports.uploadEventFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB per file
  }
}).fields([
  { name: "photos", maxCount: 10 },
  { name: "reports", maxCount: 5 }
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
      message: "Event start and end dates are required"
    });
  }

  if (new Date(event_start_date) > new Date(event_end_date)) {
    return res.status(400).json({
      message: "Event end date cannot be before start date"
    });
  }

  next();
};

/* =========================================================
   VALIDATE EVENT ID PARAM
========================================================= */

exports.validateEventId = (req, res, next) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({
      message: "Invalid event ID"
    });
  }

  req.params.id = Number(id);
  next();
};

/* =========================================================
   SANITIZE NUMERIC FIELDS
========================================================= */

exports.sanitizeEventNumbers = (req, res, next) => {
  const numericFields = [
    "event_district",
    "event_block",
    "cohort_number",
    "boys_attended",
    "girls_attended",
    "parents_attended"
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
