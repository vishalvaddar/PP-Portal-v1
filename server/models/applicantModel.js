const pool = require("../config/db");

const Applicant = {
    create: async (data) => {
        const requiredFields = [
            "nmms_year", "nmms_reg_number", "student_name", "father_name",
            "medium", "contact_no1", "district", "nmms_block",
            "current_institute_dise_code", "gmat_score", "sat_score"
        ];

        for (let field of requiredFields) {
            if (data[field] === undefined || data[field] === null || data[field] === "") {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        const regNum = Number(data.nmms_reg_number);
        if (isNaN(regNum)) throw new Error("Invalid NMMS Registration Number.");

        try {
            const checkResult = await pool.query(
                "SELECT 1 FROM pp.applicant_primary_info WHERE nmms_reg_number = $1",
                [regNum]
            );

            if (checkResult.rows.length > 0) {
                throw new Error("Student already exists with this NMMS registration number.");
            }

            const query = `
                INSERT INTO pp.applicant_primary_info (
                    nmms_year, nmms_reg_number, app_state, district, nmms_block,
                    student_name, father_name, mother_name, gmat_score, sat_score,
                    gender, medium, aadhaar, DOB, home_address, family_income_total,
                    contact_no1, contact_no2, current_institute_dise_code, previous_institute_dise_code
                ) VALUES (
                    $1, $2, $3, $4, $5,
                    $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16,
                    $17, $18, $19, $20
                ) RETURNING *;
            `;

            const values = [
                Number(data.nmms_year),
                regNum,
                data.app_state ? Number(data.app_state) : null,
                data.district ? Number(data.district) : null,
                data.nmms_block ? Number(data.nmms_block) : null,
                data.student_name,
                data.father_name,
                data.mother_name || null,
                data.gmat_score ? Number(data.gmat_score) : null,
                data.sat_score ? Number(data.sat_score) : null,
                data.gender || null,
                data.medium,
                data.aadhaar || null,
                data.DOB ? new Date(data.DOB).toISOString().split("T")[0] : null,
                data.home_address || null,
                data.family_income_total ? Number(data.family_income_total) : null,
                data.contact_no1,
                data.contact_no2,
                data.current_institute_dise_code ? Number(data.current_institute_dise_code) : null,
                data.previous_institute_dise_code ? Number(data.previous_institute_dise_code) : null
            ];

            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error("Error creating applicant:", error.message);
            throw new Error("Failed to create applicant.");
        }
    },

    getAll: async (page = 1, limit = 10, sortBy = 'applicant_id', sortOrder = 'ASC', filters = {}) => {
        try {
            const offset = (page - 1) * limit;
            const validColumns = ['applicant_id', 'nmms_reg_number', 'student_name', 'district', 'nmms_block'];
            const column = validColumns.includes(sortBy) ? sortBy : 'applicant_id';
            const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

            let whereClause = "WHERE 1=1";
            const values = [];

            if (filters.nmms_reg_number) {
                values.push(filters.nmms_reg_number.trim());
                whereClause += ` AND nmms_reg_number = $${values.length}`;
            }
            if (filters.student_name) {
                values.push(`%${filters.student_name.trim()}%`);
                whereClause += ` AND LOWER(student_name) ILIKE LOWER($${values.length})`;
            }
            if (filters.nmms_year) {
                values.push(parseInt(filters.nmms_year));
                whereClause += ` AND nmms_year = $${values.length}`;
            }
            if (filters.medium) {
                values.push(filters.medium.trim().toUpperCase());
                whereClause += ` AND UPPER(medium) = $${values.length}`;
            }
            if (filters.app_state) {
                values.push(filters.app_state.trim());
                whereClause += ` AND app_state = $${values.length}`;
            }
            if (filters.district) {
                values.push(filters.district.trim());
                whereClause += ` AND district = $${values.length}`;
            }
            if (filters.nmms_block) {
                values.push(filters.nmms_block.trim());
                whereClause += ` AND nmms_block = $${values.length}`;
            }
            if (filters.current_institute_dise_code) {
                values.push(filters.current_institute_dise_code.trim());
                whereClause += ` AND current_institute_dise_code = $${values.length}`;
            }
            if (filters.search && filters.search.trim() !== "") {
                values.push(`%${filters.search.trim()}%`);
                whereClause += ` AND (LOWER(student_name) ILIKE LOWER($${values.length}) OR nmms_reg_number ILIKE $${values.length})`;
            }

            const countResult = await pool.query(
                `SELECT COUNT(*) FROM pp.applicant_primary_info ${whereClause}`,
                values
            );
            const totalCount = parseInt(countResult.rows[0].count);

            values.push(limit);
            values.push(offset);

            const dataQuery = `
                SELECT * FROM pp.applicant_primary_info
                ${whereClause}
                ORDER BY ${column} ${order}
                LIMIT $${values.length - 1} OFFSET $${values.length}
            `;
            const result = await pool.query(dataQuery, values);

            return {
                data: result.rows,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit)
                }
            };
        } catch (error) {
            console.error("Error fetching applicants:", error.message);
            throw new Error("Failed to fetch applicants.");
        }
    },

    getByRegNumber: async (nmms_reg_number) => {
        try {
       const result = await pool.query(
         `
         SELECT
             a.*,
             s.*,
             i.institute_name,
             js.juris_name AS state_name,
             jd.juris_name AS district_name,
             jb.juris_name AS block_name
         FROM pp.applicant_primary_info a
         LEFT JOIN pp.institute i ON i.dise_code = a.current_institute_dise_code
         LEFT JOIN pp.jurisdiction js ON js.juris_code = a.app_state AND js.juris_type = 'STATE'
         LEFT JOIN pp.jurisdiction jd ON jd.juris_code = a.district AND jd.juris_type = 'EDUCATION DISTRICT'
         LEFT JOIN pp.jurisdiction jb ON jb.juris_code = a.nmms_block AND jb.juris_type = 'BLOCK'
         LEFT JOIN pp.applicant_secondary_info s ON s.applicant_id = a.applicant_id
         WHERE TRIM(a.nmms_reg_number::text) = TRIM($1)
    `,
    [nmms_reg_number]
    );

      
          return result.rows[0] || null;
        } catch (error) {
          console.error("Error fetching applicant by reg number:", error.message);
          throw new Error("Failed to fetch applicant.");
        }
    },

    update: async (applicant_id, primaryData, secondaryData) => {
        const client = await pool.connect();
        try {
            await client.query("BEGIN");
            let updatedApplicant = null;

            //Update primary info
            if(primaryData && Object.keys(primaryData).length > 0) {
                const keys = Object.keys(primaryData);
                const values = Object.values(primaryData);
                const setClause = keys.map((key, i) => `${key} = $${i+1}`).join(", ");

                const updateQuery = `
                    UPDATE pp.applicant_primary_info
                    SET ${setClause}
                    WHERE applicant_id = $${keys.length + 1}
                    RETURNING *
                `;
                const result = await client.query(updateQuery, [...values, applicant_id]);
                if (result.rowCount === 0) {
                    await client.query('ROLLBACK');
                    return null;
                }
                updatedApplicant = result.rows[0];
            }

            //Update or insert secondary info
            if(secondaryData && Object.keys(secondaryData).length > 0) {
                // Check if secondary record exists
                const checkResult = await client.query(
                    "SELECT 1 FROM pp.applicant_secondary_info WHERE applicant_id = $1",
                    [applicant_id]
                );
                
                const keys = Object.keys(secondaryData);
                const values = Object.values(secondaryData);
                
                if (checkResult.rowCount > 0) {
                    // Update existing record
                    const setClause = keys.map((key, i) => `${key} = $${i+1}`).join(", ");
                    const updateQuery = `
                        UPDATE pp.applicant_secondary_info
                        SET ${setClause}
                        WHERE applicant_id = $${keys.length + 1}
                    `;
                    await client.query(updateQuery, [...values, applicant_id]);
                } else {
                    // Insert new record
                    const columns = [...keys, 'applicant_id'];
                    const placeholders = columns.map((_, i) => `$${i + 1}`);
                    const insertQuery = `
                        INSERT INTO pp.applicant_secondary_info (${columns.join(", ")})
                        VALUES(${placeholders.join(", ")})
                    `;
                    await client.query(insertQuery, [...values, applicant_id]);
                }
            }
            
            await client.query('COMMIT');
            return updatedApplicant;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error("Error updating applicant:", error.message);
            throw new Error("Failed to update applicant: " + error.message);
        } finally {
            client.release();
        }
    },

    delete: async (nmms_reg_number) => {
        try {
            await pool.query(
                "DELETE FROM pp.applicant_primary_info WHERE nmms_reg_number = $1",
                [nmms_reg_number]
            );
            return { message: "Application deleted successfully" };
        } catch (error) {
            console.error("Error deleting applicant:", error.message);
            throw new Error("Failed to delete applicant.");
        }
    }
};

module.exports = Applicant;
