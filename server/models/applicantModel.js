const pool = require("../config/db");

const Applicant = {
    create: async (data) => {
        const query = `
            INSERT INTO pp.applicant (
                nmms_year, nmms_reg_number, app_state, nmms_district, nmms_block, student_name, father_name, 
                gmat_score, sat_score, contact_no1, contact_no2, current_institute, previous_institute, medium, 
                home_address, family_income, mother_name, gender, aadhaar, DOB
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
            ) RETURNING *;
        `;
        const values = Object.values(data).map(val => val === "" ? null : val);
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    getAll: async () => {
        const result = await pool.query("SELECT * FROM pp.applicant ORDER BY applicant_id");
        return result.rows;
    },

    update: async (id, updatedData) => {
        // Dynamically build the query
        const fields = Object.keys(updatedData);
        const values = Object.values(updatedData).map(val => val === "" ? null : val);

        if (fields.length === 0) {
            throw new Error("No data provided for update");
        }

        const setClause = fields.map((field, index) => `${field} = $${index + 1}`).join(", ");
        const query = `UPDATE pp.applicant SET ${setClause} WHERE applicant_id = $${fields.length + 1} RETURNING *`;

        const result = await pool.query(query, [...values, id]);
        return result.rows[0];
    },

    delete: async (id) => {
        await pool.query("DELETE FROM pp.applicant WHERE applicant_id = $1", [id]);
        return { message: "Application deleted successfully" };
    }
};

module.exports = Applicant;
