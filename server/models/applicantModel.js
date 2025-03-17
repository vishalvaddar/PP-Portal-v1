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
        const values = Object.values(data);
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    getAll: async () => {
        const result = await pool.query("SELECT * FROM pp.applicant ORDER BY applicant_id");
        return result.rows;
    },

    update: async (id, updatedData) => {
        const { student_name } = updatedData;
        const result = await pool.query(
            "UPDATE pp.applicant SET student_name = $1 WHERE applicant_id = $2 RETURNING *",
            [student_name, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        await pool.query("DELETE FROM pp.applicant WHERE applicant_id = $1", [id]);
        return { message: "Application deleted successfully" };
    }
};

module.exports = Applicant;
