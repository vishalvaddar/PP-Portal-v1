const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../config/db'); 

// --- 1. Multer Setup for Photo Uploads ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 }
}).array('photos', 4);


// --- 2. Event API Endpoints ---

/**
 * @route   POST /api/events
 * @desc    Create a new event in pp.event_master and photos in pp.event_photos
 */
router.post('/events', (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ msg: err.message });
    }

    const client = await pool.connect();

    try {
      const { 
        eventType, 
        startDate, 
        endDate, 
        district,
        taluka,    
        location, 
        cohort,   
        eventTitle, 
        boysCount, 
        girlsCount, 
        parentsCount 
      } = req.body;

      await client.query('BEGIN');

      // 1. Insert into Event Master
      const insertEventQuery = `
        INSERT INTO pp.event_master (
          event_type_id, 
          event_title, 
          event_start_date, 
          event_end_date, 
          event_district, 
          event_block, 
          event_location, 
          cohort_number, 
          boys_attended, 
          girls_attended, 
          parents_attended
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
        RETURNING event_id
      `;

      const eventValues = [
        eventType, // Expecting integer ID
        eventTitle,
        startDate,
        endDate,
        district,  // Expecting integer/numeric ID
        taluka,    // Expecting integer/numeric ID
        location,
        cohort,    // Expecting integer ID
        boysCount || 0,
        girlsCount || 0,
        parentsCount || 0
      ];

      const eventRes = await client.query(insertEventQuery, eventValues);
      const newEventId = eventRes.rows[0].event_id;

      // 2. Insert Photos if any
      if (req.files && req.files.length > 0) {
        const insertPhotoQuery = `
          INSERT INTO pp.event_photos (event_id, file_path, file_name)
          VALUES ($1, $2, $3)
        `;

        for (const file of req.files) {
          const filePath = file.path.replace(/\\/g, '/'); // Normalize path
          await client.query(insertPhotoQuery, [newEventId, filePath, file.originalname]);
        }
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Event created successfully', eventId: newEventId });

    } catch (dbErr) {
      await client.query('ROLLBACK');
      console.error("Database Error in POST /events:", dbErr.message);
      // Handle Unique constraint violation for event_title
      if (dbErr.code === '23505') {
        return res.status(409).json({ msg: 'Event Title already exists.' });
      }
      res.status(500).send('Server Error: ' + dbErr.message);
    } finally {
      client.release();
    }
  });
});

/**
 * @route   GET /api/events
 * @desc    Get all events with type name and photo preview
 */
router.get('/events', async (req, res) => {
  try {
    // Join with event_type to get the name, and aggregate one photo for preview
    const query = `
      SELECT 
        m.event_id, 
        m.event_title, 
        t.event_type_name as event_type, 
        m.event_start_date as start_date, 
        m.event_end_date as end_date, 
        m.event_location as location, 
        m.boys_attended as boys_count, 
        m.girls_attended as girls_count,
        (SELECT file_path FROM pp.event_photos p WHERE p.event_id = m.event_id LIMIT 1) as cover_photo
      FROM pp.event_master m
      JOIN pp.event_type t ON m.event_type_id = t.event_type_id
      ORDER BY m.event_start_date DESC
    `;
    
    const allEvents = await pool.query(query);
    res.json(allEvents.rows);
  } catch (err) {
    console.error("Database Error in GET /events:", err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    Get a single event by ID with all details and photos
 */
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch Master Data
    const eventQuery = `
      SELECT 
        m.*, 
        t.event_type_name 
      FROM pp.event_master m
      JOIN pp.event_type t ON m.event_type_id = t.event_type_id
      WHERE m.event_id = $1
    `;
    const eventRes = await pool.query(eventQuery, [id]);
    
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    // Fetch Photos
    const photosQuery = `SELECT file_path FROM pp.event_photos WHERE event_id = $1`;
    const photosRes = await pool.query(photosQuery, [id]);
    
    const eventData = eventRes.rows[0];
    // Map keys to match frontend expectation if necessary
    const responseData = {
      id: eventData.event_id,
      eventTitle: eventData.event_title,
      eventType: eventData.event_type_name, // Or ID if you need to edit
      startDate: eventData.event_start_date,
      endDate: eventData.event_end_date,
      district: eventData.event_district,
      taluka: eventData.event_block,
      location: eventData.event_location,
      cohort: eventData.cohort_number,
      boysCount: eventData.boys_attended,
      girlsCount: eventData.girls_attended,
      parentsCount: eventData.parents_attended,
      photos: photosRes.rows.map(row => row.file_path)
    };

    res.json(responseData);
  } catch (err) {
    console.error("Database Error in GET /events/:id:", err.message);
    res.status(500).send('Server Error');
  }
});


// --- 3. Event Type API Endpoints ---

/**
 * @route   GET /api/event-types
 * @desc    Get all event types (ID and Name)
 */
router.get('/event-types', async (req, res) => {
  try {
    // Return objects with ID and Name so frontend can send ID
    const types = await pool.query("SELECT event_type_id, event_type_name FROM pp.event_type ORDER BY event_type_name ASC");
    res.json(types.rows); 
  } catch (err) {
    console.error("Database Error in GET /event-types:", err.message);
    res.status(500).json([]);
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
    
    const newType = await pool.query(
      "INSERT INTO pp.event_type (event_type_name) VALUES ($1) RETURNING *", [name]
    );
    res.status(201).json(newType.rows[0]);

  } catch (err) {
    console.error("Database Error in POST /event-types:", err.message);
    // Handle duplicate name error
    if (err.code === '23505') { 
        return res.status(409).json({ msg: 'Event type already exists' });
    }
    res.status(500).send('Server Error: ' + err.message);
  }
});

module.exports = router;