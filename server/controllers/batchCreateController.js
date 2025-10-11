const pool = require("../config/db");

// 1. Get Coordinators
exports.getCoordinators = async (req, res) => {
  try {
    const roleRes = await pool.query(
      `SELECT role_id FROM pp.role WHERE role_name = 'BATCH COORDINATOR'`
    );

    if (roleRes.rows.length === 0)
      return res.status(404).json({ error: "Coordinator role not found" });

    const roleId = roleRes.rows[0].role_id;

    const result = await pool.query(
      `SELECT u.user_id AS id, u.user_name AS name
       FROM pp.user u
       JOIN pp.user_role ur ON u.user_id = ur.user_id
       WHERE ur.role_id = $1`,
      [roleId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching coordinators:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 2. Create Batch
exports.createBatch = async (req, res) => {
  try {
    const { batch_name, cohort_number, batch_status = "active", coordinator_id = null } = req.body;

    if (!batch_name || cohort_number == null)
      return res.status(400).json({ error: "batch_name and cohort_number are required" });

    // This query correctly checks if the batch name is unique *for the given cohort*.
    const existing = await pool.query(
      `SELECT 1 FROM pp.batch WHERE batch_name = $1 AND cohort_number = $2`,
      [batch_name.trim(), cohort_number]
    );

    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Batch with this name already exists for the selected cohort." });

    const result = await pool.query(
      `INSERT INTO pp.batch (batch_name, cohort_number, batch_status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [batch_name.trim(), cohort_number, batch_status.toLowerCase()]
    );

    const batchId = result.rows[0].batch_id;

    if (coordinator_id) {
      await pool.query(
        `INSERT INTO pp.batch_coordinator_batches (user_id, batch_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [coordinator_id, batchId]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error creating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 3. Get All Batches
exports.getAllBatches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.batch_id AS id, 
        b.batch_name, 
        b.batch_status,
        b.cohort_number, 
        c.cohort_name, 
        u.user_name AS coordinator_name,
        u.user_id AS coordinator_id
      FROM pp.batch b
      LEFT JOIN pp.cohort c ON b.cohort_number = c.cohort_number
      LEFT JOIN pp.batch_coordinator_batches bcb ON b.batch_id = bcb.batch_id
      LEFT JOIN pp.user u ON bcb.user_id = u.user_id
      ORDER BY b.batch_id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching batches:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getBatchById = async (req, res) => {
    const { batchId } = req.params;
    try {
        const result = await pool.query(`
            SELECT 
                b.batch_id, 
                b.batch_name,
                c.cohort_name
            FROM pp.batch b
            LEFT JOIN pp.cohort c ON b.cohort_number = c.cohort_number
            WHERE b.batch_id = $1
        `, [batchId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Batch not found." });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching batch by ID:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 4. Update Batch
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_name, cohort_number, coordinator_id, batch_status } = req.body;

    if (!batch_name || cohort_number == null || !batch_status)
      return res.status(400).json({ error: "Missing required fields" });

    // This query correctly checks for duplicates within the same cohort when renaming.
    const duplicate = await pool.query(
      `SELECT 1 FROM pp.batch
       WHERE batch_name = $1 AND cohort_number = $2 AND batch_id != $3`,
      [batch_name.trim(), cohort_number, id]
    );

    if (duplicate.rows.length > 0)
      return res.status(409).json({ error: "Batch with this name already exists for the selected cohort." });

    const result = await pool.query(
      `UPDATE pp.batch
       SET batch_name = $1, cohort_number = $2, batch_status = $3
       WHERE batch_id = $4
       RETURNING *`,
      [batch_name.trim(), cohort_number, batch_status.toLowerCase(), id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Batch not found" });

    await pool.query(`DELETE FROM pp.batch_coordinator_batches WHERE batch_id = $1`, [id]);
    if (coordinator_id) {
      await pool.query(
        `INSERT INTO pp.batch_coordinator_batches (user_id, batch_id)
         VALUES ($1, $2)`,
        [coordinator_id, id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error updating batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 5. Delete Batch
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM pp.batch_coordinator_batches WHERE batch_id = $1`, [id]);
    const result = await pool.query(`DELETE FROM pp.batch WHERE batch_id = $1 RETURNING *`, [id]);

    if (result.rowCount === 0)
      return res.status(404).json({ error: "Batch not found" });

    res.json({ message: "Batch deleted successfully", deleted: result.rows[0] });
  } catch (err) {
    console.error("Error deleting batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 6. Assign Coordinator
exports.assignCoordinator = async (req, res) => {
  try {
    const { id } = req.params;
    const { coordinator_id } = req.body;

    if (!coordinator_id)
      return res.status(400).json({ error: "coordinator_id is required" });

    await pool.query(`DELETE FROM pp.batch_coordinator_batches WHERE batch_id = $1`, [id]);
    await pool.query(
      `INSERT INTO pp.batch_coordinator_batches (user_id, batch_id)
       VALUES ($1, $2)`,
      [coordinator_id, id]
    );

    res.json({ message: "Coordinator assigned successfully." });
  } catch (err) {
    console.error("Error assigning coordinator:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 7. Get Batch Names
exports.getBatchNames = async (req, res) => {
  try {
    const result = await pool.query(`SELECT batch_name FROM pp.batch ORDER BY name ASC`);
    res.json(result.rows.map((row) => ({ label: row.name, value: row.name })));
  } catch (err) {
    console.error("Error fetching batch names:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 8. Add Batch Name
exports.addBatchName = async (req, res) => {
  const { batch_name, cohort_number, created_by } = req.body;

  if (!batch_name || batch_name.trim().length < 2) {
    return res.status(400).json({ error: "Batch name must be at least 2 characters" });
  }
  if (!cohort_number) {
    return res.status(400).json({ error: "Cohort number is required" });
  }
  if (!created_by) {
    return res.status(400).json({ error: "Created by (user ID) is required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pp.batch (batch_name, cohort_number, created_by, updated_by)
       VALUES ($1, $2, $3, $3)
       ON CONFLICT (cohort_number, batch_name) DO NOTHING
       RETURNING *`,
      [batch_name.trim(), cohort_number, created_by]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({ message: "Batch name already exists for this cohort" });
    }

    res.status(201).json({
      message: "Batch created successfully",
      batch: result.rows[0]
    });
  } catch (err) {
    console.error("Error saving batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


// 9. Get All Cohorts
exports.getAllCohorts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cohort_number, cohort_name, start_date, description 
      FROM pp.cohort 
      ORDER BY cohort_number ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching cohorts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 10. Create Cohort (UPDATED LOGIC)
exports.createCohort = async (req, res) => {
  const { cohort_name, start_date, description } = req.body;

  if (!cohort_name || !start_date)
    return res.status(400).json({ error: "cohort_name and start_date are required." });

  try {
    // Rule: Check if cohort_name is unique across all years.
    const existingCohortName = await pool.query(
      `SELECT 1 FROM pp.cohort WHERE cohort_name = $1`,
      [cohort_name.trim()]
    );

    if (existingCohortName.rows.length > 0) {
      return res.status(409).json({ error: "A cohort with this name already exists." });
    }

    // Rule: Automatically determine cohort_number from the start_date's year.
    const year = new Date(start_date).getFullYear();
    if (isNaN(year)) {
        return res.status(400).json({ error: "Invalid start_date format." });
    }
    // This logic sets cohort_number to 1 for 2022, 2 for 2023, etc.
    const cohort_number = year - 2021;

    // Rule: Check if a cohort for this year (and thus, this number) already exists.
    const existingCohortForYear = await pool.query(
        `SELECT 1 FROM pp.cohort WHERE cohort_number = $1`,
        [cohort_number]
    );

    if (existingCohortForYear.rows.length > 0) {
        return res.status(409).json({ error: `A cohort for the year ${year} already exists.` });
    }

    const result = await pool.query(
      `INSERT INTO pp.cohort (cohort_number, cohort_name, start_date, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cohort_number, cohort_name.trim(), start_date, description || null]
    );

    res.status(201).json({
      message: "Cohort created successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error("Error creating cohort:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 11. Update Cohort (NEW FUNCTION)
exports.updateCohort = async (req, res) => {
    const { id } = req.params; // Assuming the route is /cohorts/:id and id is cohort_number
    const { cohort_name, start_date, description } = req.body;

    if (!cohort_name || !start_date) {
        return res.status(400).json({ error: "cohort_name and start_date are required." });
    }

    try {
        // Rule: Check if the new cohort_name is unique, excluding the current cohort.
        const existingCohort = await pool.query(
            `SELECT 1 FROM pp.cohort WHERE cohort_name = $1 AND cohort_number != $2`,
            [cohort_name.trim(), id]
        );

        if (existingCohort.rows.length > 0) {
            return res.status(409).json({ error: "A cohort with this name already exists." });
        }

        const result = await pool.query(
            `UPDATE pp.cohort 
             SET cohort_name = $1, start_date = $2, description = $3
             WHERE cohort_number = $4
             RETURNING *`,
            [cohort_name.trim(), start_date, description || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Cohort not found." });
        }

        res.status(200).json({
            message: "Cohort updated successfully",
            data: result.rows[0]
        });
    } catch (err) {
        console.error("Error updating cohort:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

//12. Students present in the batch.
exports.getStudentsInBatch = async (req, res) => {
  const { id } = req.params;

  try{
    const result = await pool.query(`
      SELECT sm.*, api.nmms_reg_number
      FROM pp.batch b
      JOIN pp.student_master sm ON sm.batch_id = b.batch_id
      JOIN pp.applicant_primary_info api ON sm.applicant_id = api.applicant_id
      WHERE b.batch_id = $1
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching students in batch:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//13. Get active cohorts
exports.getActiveCohorts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM pp.cohort
      WHERE end_date IS NULL
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching active cohorts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//14.
exports.getBatchesByCohort = async (req, res) => {
  try {
    const { cohort_number } = req.params;
    if (!cohort_number) {
      return res.status(400).json({ error: "cohort_number query parameter is required" });
    }

    const result = await pool.query(`
      SELECT * 
      FROM pp.batch
      WHERE cohort_number = $1
    `, [cohort_number]);

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching batches by cohort:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }

};

//15. Get students info
exports.getStudentsInfoFromBatch = async (req, res) => {
  try {
    const { enr_id } = req.params;

    const result = await pool.query(
      `SELECT 
          sm.enr_id,
          api.nmms_reg_number,
          api.nmms_year,
          api.student_name,
          api.father_name,
          api.mother_name,
          api.gender,
          api.aadhaar,
          api.dob,
          api.medium,
          api.home_address,
          api.family_income_total,
          api.contact_no1,
          api.contact_no2,
          api.current_institute_dise_code,
          api.previous_institute_dise_code,
          asi.village,
          asi.father_occupation,
          asi.mother_occupation,
          asi.father_education,
          asi.mother_education,
          asi.household_size,
          asi.own_house,
          asi.smart_phone_home,
          asi.internet_facility_home,
          asi.career_goals,
          asi.subjects_of_interest,
          asi.transportation_mode,
          asi.distance_to_school,
          asi.num_two_wheelers,
          asi.num_four_wheelers,
          asi.irrigation_land,
          asi.neighbor_name,
          asi.neighbor_phone,
          asi.favorite_teacher_name,
          asi.favorite_teacher_phone
       FROM pp.student_master sm
       JOIN pp.applicant_primary_info api USING (applicant_id)
       JOIN pp.applicant_secondary_info asi USING (applicant_id)
       WHERE sm.enr_id = $1`,
      [enr_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    // ✅ Return reg_number explicitly with other fields
    res.json({
      reg_number: result.rows[0].nmms_reg_number,
      ...result.rows[0]
    });
  } catch (err) {
    console.error("Error fetching student info:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
