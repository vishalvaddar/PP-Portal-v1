const pool = require("../config/db");

// Insert event
exports.insertEvent = async (eventData) => {
  const query = `
    INSERT INTO pp.event_master (
      event_type_id, event_title, event_start_date, event_end_date,
      event_district, event_block, event_location,
      cohort_number, boys_attended, girls_attended, parents_attended
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING event_id
  `;

  const values = [
    eventData.eventType,
    eventData.eventTitle,
    eventData.startDate,
    eventData.endDate,
    eventData.district,
    eventData.taluka,
    eventData.location,
    eventData.cohort,
    eventData.boysCount,
    eventData.girlsCount,
    eventData.parentsCount
  ];

  const result = await pool.query(query, values);
  return result.rows[0].event_id;
};

// Save event photos
exports.insertPhotos = async (photos, eventId) => {
  const query = `
      INSERT INTO pp.event_photos (event_id, file_path, file_name)
      VALUES ($1,$2,$3)
  `;

  for (const file of photos) {
    await pool.query(query, [
      eventId,
      file.path.replace(/\\/g, "/"),
      file.originalname
    ]);
  }
};

// Get all events
exports.getAll = async () => {
  const query = `
    SELECT 
      m.event_id,
      m.event_title,
      t.event_type_name AS event_type,
      m.event_start_date AS start_date,
      m.event_end_date AS end_date,
      m.event_location AS location,
      m.boys_attended AS boys_count,
      m.girls_attended AS girls_count,
      (SELECT file_path FROM pp.event_photos p WHERE p.event_id = m.event_id LIMIT 1) AS cover_photo
    FROM pp.event_master m
    JOIN pp.event_type t ON m.event_type_id = t.event_type_id
    ORDER BY m.event_start_date DESC
  `;
  return (await pool.query(query)).rows;
};

// Get event by ID
exports.getById = async (id) => {
  const query = `
    SELECT 
      m.*, 
      t.event_type_name
    FROM pp.event_master m
    JOIN pp.event_type t ON m.event_type_id = t.event_type_id
    WHERE m.event_id = $1
  `;
  const result = await pool.query(query, [id]);
  return result.rows.length ? result.rows[0] : null;
};

// Get photos for event
exports.getPhotos = async (id) => {
  const result = await pool.query(
    `SELECT file_path FROM pp.event_photos WHERE event_id = $1`,
    [id]
  );
  return result.rows.map((p) => p.file_path);
};

// Delete event
exports.deleteEvent = async (id) => {
  return await pool.query(
    "DELETE FROM pp.event_master WHERE event_id = $1",
    [id]
  );
};
