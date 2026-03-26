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

exports.insertPhoto = async (db, values) => {
  const query = `
    INSERT INTO pp.event_photos (event_id, file_path, file_name, uploaded_by)
    VALUES ($1, $2, $3, $4)
  `;
  await db.query(query, values);
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

exports.insertEventReport = async (db, values) => {
  const query = `
    INSERT INTO pp.event_reports (event_id, report_type, file_path, file_name, generated_by)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await db.query(query, values);
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

/* =========================================================
   For Sammelan Event attendece fill
========================================================= */
exports.getSammelanEvents = async () => {
  const query = `
    SELECT em.event_id, em.event_title 
    FROM pp.event_master em
    JOIN pp.event_type et ON et.event_type_id = em.event_type_id
    WHERE et.event_type_name = 'Sammelan'
  `;
  const { rows } = await pool.query(query);
  return rows;
};

exports.getStates = async () => {
  const query = `SELECT juris_code, juris_name FROM pp.jurisdiction WHERE LOWER(juris_type) = 'state'`;
  const { rows } = await pool.query(query);
  return rows;
};

exports.getDivisionsByState = async (stateName) => {
  const query = `
    SELECT juris_code, juris_name FROM pp.jurisdiction 
    WHERE parent_juris IN (
      SELECT juris_code FROM pp.jurisdiction 
      WHERE LOWER(TRIM(juris_name)) = LOWER(TRIM($1)) AND LOWER(juris_type) = 'state'
    ) AND LOWER(juris_type) = 'division'`;
  const { rows } = await pool.query(query, [stateName]);
  return rows;
};

exports.getDistrictsByDivisions = async (divisionNames) => {
  // Ensure divisionNames is an array and lowercase every element
  const lowerDivisions = Array.isArray(divisionNames) 
    ? divisionNames.map(d => d.toLowerCase().trim()) 
    : [divisionNames.toLowerCase().trim()];

  const query = `
    SELECT juris_code, juris_name FROM pp.jurisdiction 
    WHERE parent_juris IN (
      SELECT juris_code FROM pp.jurisdiction 
      WHERE LOWER(TRIM(juris_name)) = ANY($1) 
      AND LOWER(juris_type) = 'division'
    ) AND LOWER(juris_type) = 'education district'`;

  const { rows } = await pool.query(query, [lowerDivisions]);
  return rows;
};

exports.getBlocksByMultiDistricts = async (stateName, divisionNames, districtNames) => {
  // 1. Ensure inputs are arrays and lowercase them to match LOWER(TRIM()) in SQL
  const lowerDivisions = Array.isArray(divisionNames) 
    ? divisionNames.map(d => d.toLowerCase().trim()) 
    : [divisionNames.toLowerCase().trim()];

  const lowerDistricts = Array.isArray(districtNames) 
    ? districtNames.map(d => d.toLowerCase().trim()) 
    : [districtNames.toLowerCase().trim()];

  const query = `
    SELECT j.juris_code, j.juris_name,
      CASE WHEN j.juris_code IN (
        SELECT sbj.juris_code FROM pp.shortlist_batch_jurisdiction AS sbj
        JOIN pp.shortlist_batch AS sb ON sbj.shortlist_batch_id = sb.shortlist_batch_id
        WHERE sb.frozen_yn = 'Y'
      ) THEN TRUE ELSE FALSE END AS is_frozen_block
    FROM pp.jurisdiction AS j
    WHERE LOWER(j.juris_type) = 'block'
      AND j.parent_juris IN (
        SELECT d.juris_code FROM pp.jurisdiction d
        WHERE LOWER(TRIM(d.juris_name)) = ANY($3) 
          AND LOWER(d.juris_type) = 'education district'
          AND d.parent_juris IN (
            SELECT div.juris_code FROM pp.jurisdiction div
            WHERE LOWER(TRIM(div.juris_name)) = ANY($2)
              AND LOWER(div.juris_type) = 'division'
              AND div.parent_juris IN (
                SELECT s.juris_code FROM pp.jurisdiction s
                WHERE LOWER(TRIM(s.juris_name)) = LOWER(TRIM($1))
                  AND LOWER(s.juris_type) = 'state'
              )
          )
      )
  `;

  // Use the processed lowercase arrays here
  const { rows } = await pool.query(query, [stateName, lowerDivisions, lowerDistricts]);
  return rows;
};

exports.getSammelanStudentList = async (filters) => {
  const { eventTitle, stateName, districtNames, blockNames, limit = 15, offset = 0 } = filters;

  const query = `
    SELECT DISTINCT
        sm.student_id,
        sm.student_name,
        bl.juris_name AS block_name,
        d.juris_name AS district_name
    FROM pp.student_master sm
    JOIN pp.event_master em ON em.event_title = $1
    JOIN pp.applicant_primary_info a ON sm.applicant_id = a.applicant_id
    LEFT JOIN pp.jurisdiction d ON a.district = d.juris_code
    LEFT JOIN pp.jurisdiction bl ON a.nmms_block = bl.juris_code
    LEFT JOIN pp.jurisdiction s ON a.app_state = s.juris_code
    WHERE sm.active_yn = 'ACTIVE'
      -- Mandatory: Event Title
      AND em.event_title = $1
      -- Optional filters:
      AND ($2::text IS NULL OR s.juris_name = $2)
      AND ($3::text[] IS NULL OR d.juris_name = ANY($3))
      AND ($4::text[] IS NULL OR bl.juris_name = ANY($4))
    ORDER BY sm.student_name
    LIMIT $5 OFFSET $6;
  `;

  // IMPORTANT: If an array is empty [], it must be passed as NULL
  const values = [
    eventTitle,
    stateName || null,
    (districtNames && districtNames.length > 0) ? districtNames : null,
    (blockNames && blockNames.length > 0) ? blockNames : null,
    limit,
    offset
  ];

  const { rows } = await pool.query(query, values);
  return rows;
};

exports.saveSammelanAttendance = async (db, eventId, presentStudentIds) => {
  const query = `
    WITH inserted AS (
        INSERT INTO pp.event_students (event_id, student_id)
        SELECT $1, unnest($2::int[])
        ON CONFLICT (event_id, student_id) DO NOTHING
        RETURNING *
    )
    SELECT COUNT(*) AS inserted_rows FROM inserted;
  `;

  // Use 'db.query' (the pool or client passed from controller)
  const { rows } = await db.query(query, [eventId, presentStudentIds]);
  return rows[0]?.inserted_rows || 0;
};