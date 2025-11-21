const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
// const db = require('../db'); // Import your database connection

// --- 1. Multer Setup for Photo Uploads ---
// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events'); // Ensure 'uploads/events' directory exists
  },
  filename: (req, file, cb) => {
    // Create a unique filename: event-timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer: 4 photos max, using field name 'photos'
const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { files: 4 } 
}).array('photos', 4);


// --- 2. Event API Endpoints ---

/**
 * @route   POST /api/events
 * @desc    Create a new event (with photo uploads)
 */
router.post('/events', (req, res) => {
  // Use 'upload' middleware. If error (e.g., > 4 files), it will be caught.
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ msg: err.message });
    }

    try {
      // req.body contains all the text fields from your form
      const { 
        eventType, startDate, endDate, district, taluka, location, 
        cohort, eventTitle, boysCount, girlsCount, parentsCount 
      } = req.body;

      // req.files contains an array of photo objects
      // We just want their paths to store in the DB
      const photoPaths = req.files.map(file => file.path);

      // --- 💾 DATABASE LOGIC (Example for PostgreSQL) ---
      // const newEvent = await db.query(
      //   `INSERT INTO events (event_type, start_date, end_date, district, taluka, location, cohort, event_title, boys_count, girls_count, parents_count, photo_urls) 
      //    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      //    RETURNING *`,
      //   [
      //     eventType, startDate, endDate, district, taluka, location, 
      //     cohort, eventTitle, boysCount, girlsCount, parentsCount, 
      //     JSON.stringify(photoPaths) // Store photo paths as a JSON array
      //   ]
      // );
      // res.status(201).json(newEvent.rows[0]);
      // --- End DB Logic ---

      // Mock response for now:
      console.log('Body:', req.body);
      console.log('Files:', photoPaths);
      res.status(201).json({ 
        ...req.body, 
        photos: photoPaths, 
        id: Date.now() // Mock ID
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
});

/**
 * @route   GET /api/events
 * @desc    Get all events
 */
router.get('/events', async (req, res) => {
  try {
    // --- 💾 DATABASE LOGIC ---
    // const allEvents = await db.query(
    //   `SELECT id, event_title, event_type, start_date, taluka, district, boys_count, girls_count 
    //    FROM events ORDER BY start_date DESC`
    // );
    // res.json(allEvents.rows);
    // --- End DB Logic ---

    // Mock response for now:
    res.json([
      { id: 1, eventTitle: 'Sammelan251025-Cohort-3-Ankola', eventType: 'Pratibha Sammelan', startDate: '2025-10-25', location: 'Ankola, Uttara Kannada', boysCount: 50, girlsCount: 55 },
      { id: 2, eventTitle: 'Ignite200925-Cohort-2-Hubballi', eventType: 'Ignite Workshop & Test', startDate: '2025-09-20', location: 'Hubballi, Dharwad', boysCount: 120, girlsCount: 110 }
    ]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    Get a single event by ID
 */
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // --- 💾 DATABASE LOGIC ---
    // const event = await db.query("SELECT * FROM events WHERE id = $1", [id]);
    // if (event.rows.length === 0) {
    //   return res.status(404).json({ msg: 'Event not found' });
    // }
    // res.json(event.rows[0]);
    // --- End DB Logic ---

    // Mock response for now:
    res.json({
      id: 1, eventTitle: 'Sammelan251025-Cohort-3-Ankola', eventType: 'Pratibha Sammelan', startDate: '2025-10-25', endDate: '2025-10-27', district: 'Uttara Kannada', taluka: 'Ankola', location: 'Nature Bound Sahyadris, Sunksal', cohort: '3', boysCount: 50, girlsCount: 55, parentsCount: 10,
      photos: [ 'uploads/events/mock-photo1.jpg', 'uploads/events/mock-photo2.jpg' ]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


// --- 3. Event Type API Endpoints ---

/**
 * @route   GET /api/event-types
 * @desc    Get all event types
 */
router.get('/event-types', async (req, res) => {
  try {
    // --- 💾 DATABASE LOGIC ---
    // const types = await db.query("SELECT * FROM event_types ORDER BY name ASC");
    // res.json(types.rows.map(t => t.name)); // Send as an array of strings
    // --- End DB Logic ---
    
    // Mock Response
    res.json([ 'Ignite Workshop & Test', 'Pratibha Poshak Induction', 'Pratibha Sammelan' ]);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   POST /api/event-types
 * @desc    Create a new event type
 */
router.post('/event-types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ msg: 'Name is required' });
    }
    // --- 💾 DATABASE LOGIC ---
    // const newType = await db.query(
    //   "INSERT INTO event_types (name) VALUES ($1) RETURNING *", [name]
    // );
    // res.status(201).json(newType.rows[0]);
    // --- End DB Logic ---
    
    // Mock response
    res.status(201).json({ id: Date.now(), name: name });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;