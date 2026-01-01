const pool = require("../config/db");

/* =========================================================
   EVENT TYPE
========================================================= */

exports.createEventType = async (name) => {
  const query = `
    INSERT INTO pp.event_type (event_type_name)
    VALUES ($1)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [name]);
  return rows[0];
};

exports.updateEventType = async (id, name) => {
  const query = `
    UPDATE pp.event_type
    SET event_type_name = $1
    WHERE event_type_id = $2
    RETURNING *
  `;
  const { rows } = await pool.query(query, [name, id]);
  return rows[0];
};

exports.getEventTypes = async () => {
  const query = `
    SELECT event_type_id, event_type_name
    FROM pp.event_type
    ORDER BY event_type_name ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

exports.getEventTypeByName = async (name) => {
  const query = `
    SELECT *
    FROM pp.event_type
    WHERE event_type_name = $1
  `;
  const { rows } = await pool.query(query, [name]);
  return rows[0];
};


/* =========================================================
   EVENT MASTER
========================================================= */

// CREATE EVENT (transaction handled in controller)
exports.createEvent = async (client, values) => {
  const query = `
    INSERT INTO pp.event_master (
      event_type_id,
      event_title,
      event_description,
      event_start_date,
      event_end_date,
      event_district,
      event_block,
      event_location,
      pincode,
      cohort_number,
      boys_attended,
      girls_attended,
      parents_attended,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING event_id
  `;
  const { rows } = await client.query(query, values);
  return rows[0].event_id;
};


// UPDATE EVENT
exports.updateEvent = async (client, values) => {
  const query = `
    UPDATE pp.event_master
    SET
      event_type_id = $1,
      event_title = $2,
      event_description = $3,
      event_start_date = $4,
      event_end_date = $5,
      event_district = $6,
      event_block = $7,
      event_location = $8,
      pincode = $9,
      cohort_number = $10,
      boys_attended = $11,
      girls_attended = $12,
      parents_attended = $13,
      updated_by = $14,
      updated_at = CURRENT_TIMESTAMP
    WHERE event_id = $15
  `;
  await client.query(query, values);
};


// DELETE EVENT (photos & reports CASCADE)
exports.deleteEvent = async (eventId) => {
  await pool.query(
    `DELETE FROM pp.event_master WHERE event_id = $1`,
    [eventId]
  );
};


/* =========================================================
   EVENT PHOTOS
========================================================= */

exports.insertPhoto = async (client, values) => {
  const query = `
    INSERT INTO pp.event_photos (
      event_id,
      file_path,
      file_name,
      uploaded_by
    )
    VALUES ($1,$2,$3,$4)
  `;
  await client.query(query, values);
};

exports.getEventPhotos = async (eventId) => {
  const query = `
    SELECT photo_id, file_path, file_name
    FROM pp.event_photos
    WHERE event_id = $1
  `;
  const { rows } = await pool.query(query, [eventId]);
  return rows;
};


/* =========================================================
   EVENT REPORTS
========================================================= */

exports.insertEventReport = async (client, values) => {
  const query = `
    INSERT INTO pp.event_reports (
      event_id,
      report_type,
      file_path,
      file_name,
      generated_by
    )
    VALUES ($1,$2,$3,$4,$5)
  `;
  await client.query(query, values);
};

exports.getEventReports = async (eventId) => {
  const query = `
    SELECT *
    FROM pp.event_reports
    WHERE event_id = $1
    ORDER BY generated_at DESC
  `;
  const { rows } = await pool.query(query, [eventId]);
  return rows;
};


/* =========================================================
   FETCH EVENTS
========================================================= */

exports.getAllEvents = async () => {
  const query = `
    SELECT
      m.event_id,
      m.event_title,
      m.event_description,
      m.event_start_date AS start_date,
      m.event_end_date AS end_date,
      m.event_location,
      m.cohort_number,
      m.boys_attended,
      m.girls_attended,
      m.parents_attended,
      t.event_type_name AS event_type,
      (
        SELECT p.file_path
        FROM pp.event_photos p
        WHERE p.event_id = m.event_id
        LIMIT 1
      ) AS cover_photo
    FROM pp.event_master m
    JOIN pp.event_type t ON t.event_type_id = m.event_type_id
    ORDER BY m.event_start_date DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};


exports.getEventById = async (eventId) => {
  const query = `
    SELECT
      m.*,
      t.event_type_name
    FROM pp.event_master m
    JOIN pp.event_type t ON t.event_type_id = m.event_type_id
    WHERE m.event_id = $1
  `;
  const { rows } = await pool.query(query, [eventId]);
  return rows[0];
};

