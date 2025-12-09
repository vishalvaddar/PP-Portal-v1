const pool = require("../config/db");

exports.createEvent = async (client, values) => {
  const query = `
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
  const { rows } = await client.query(query, values);
  return rows[0].event_id;
};

exports.insertPhoto = async (client, values) => {
  const query = `
    INSERT INTO pp.event_photos (event_id, file_path, file_name)
    VALUES ($1, $2, $3)
  `;
  const { rows } = await client.query(query, values);
  return rows[0];
};

exports.getAllEvents = async () => {
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
  const { rows } = await pool.query(query);
  return rows;
};

exports.getEventById = async (id) => {
  const query = `
    SELECT 
      m.*, 
      t.event_type_name 
    FROM pp.event_master m
    JOIN pp.event_type t ON m.event_type_id = t.event_type_id
    WHERE m.event_id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};

exports.getEventPhotos = async (id) => {
  const query = `SELECT file_path FROM pp.event_photos WHERE event_id = $1`;
  const { rows } = await pool.query(query, [id]);
  return rows;
};

exports.getEventTypes = async () => {
  const { rows } = await pool.query(
    "SELECT event_type_id, event_type_name FROM pp.event_type ORDER BY event_type_name ASC"
  );
  return rows;
};

exports.createEventType = async (name) => {
  const query = `
    INSERT INTO pp.event_type (event_type_name)
    VALUES ($1) RETURNING *
  `;
  const { rows } = await pool.query(query, [name]);
  return rows[0];
};

exports.getEventTypeByName = async (name) => {
  const query = `
    SELECT * FROM pp.event_type WHERE event_type_name = $1
  `;
  const { rows } = await pool.query(query, [name]);
  return rows[0];
};

exports.updateEventType = async (id, name) => {
  const query = `
    UPDATE pp.event_type
    SET event_type_name = $1
    WHERE event_type_id = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [name, id]);
  return rows[0];
};

exports.deleteEventType = async (id) => {
  const { rows } = await pool.query(
    `DELETE FROM pp.event_type WHERE event_type_id = $1 RETURNING event_type_id`,
    [id]
  );
  return rows[0];
};

  