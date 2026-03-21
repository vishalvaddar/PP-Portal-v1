const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =========================================================
  BASE DIRECTORY CONFIGURATION
========================================================= */

const BASE_EVENT_DIR = process.env.EVENT_STORAGE_PATH 
  ? path.resolve(process.env.EVENT_STORAGE_PATH) 
  : path.join(__dirname, "..", "uploads", "events");

const PHOTOS_DIR = path.join(BASE_EVENT_DIR, "photos");
const REPORTS_DIR = path.join(BASE_EVENT_DIR, "reports");

// Ensure both folders exist
[PHOTOS_DIR, REPORTS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

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
    } else if (file.fieldname === "reports") {
      cb(null, REPORTS_DIR);
    } else {
      cb(new Error("Invalid field"), null);
    }
  },

  filename: (req, file, cb) => {
    // 1. Get Title from body (sent from frontend)
    let eventTitle = req.body.eventTitle || "event";
    
    // 2. Clean the title: remove spaces/special chars
    const cleanName = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const extension = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "photos") {
      // Initialize a counter on the request object if it doesn't exist
      if (!req.photoIndex) {
        req.photoIndex = 1;
      } else {
        req.photoIndex++;
      }
      
      // Result: event_title-1.jpg, event_title-2.jpg
      const fileName = `${cleanName}-${req.photoIndex}${extension}`;
      cb(null, fileName);
    } else if (file.fieldname === "reports") {
      // Result: event_title-report.pdf
      const fileName = `${cleanName}-report${extension}`;
      cb(null, fileName);
    }
  }
});




/* =========================================================
   FILE FILTER (IMAGES ONLY)
========================================================= */

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "photos") {
    const allowedImages = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (allowedImages.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Photos must be JPG, PNG, or WEBP"), false);
    }
  } else if (file.fieldname === "reports") {
    // FIX: Allow PDFs and Word docs for reports
    const allowedDocs = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedDocs.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Reports must be PDF or Word documents"), false);
    }
  } else {
    cb(null, false);
  }
};

/* =========================================================
   UPLOAD MIDDLEWARE
========================================================= */

// Wrap the multer call to catch limit errors
exports.uploadEventFiles = (req, res, next) => {
  const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
  }).fields([
    { name: "photos", maxCount: 4 },
    { name: "reports", maxCount: 1 }
  ]);

  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ message: "Too many files! Max 4 photos and 1 report allowed." });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

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
