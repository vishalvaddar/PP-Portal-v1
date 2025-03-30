//applicant.js
const pool = require("../config/db");
const path = require("path");
const fs = require("fs");

const Applicant = {
    create: async (data) => {
        const requiredFields = [
            "nmms_year", "nmms_reg_number", "student_name", "father_name",
            "medium", "contact_no1", "contact_no2", "district",
            "nmms_block", "current_institute_dise_code", "gmat_score", "sat_score"
        ];

        for (let field of requiredFields) {
            if (typeof data[field] === "string" && data[field].trim() === "") {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        try {
            // Check if student already exists
            const checkResult = await pool.query(
                "SELECT 1 FROM pp.applicant_primary_info WHERE nmms_reg_number = $1",
                [data.nmms_reg_number]
            );
            if (checkResult.rows.length > 0) {
                throw new Error("Student already exists with this NMMS registration number.");
            }

            // Fetch district and state
            const districtQuery = `
                SELECT j1.juris_name AS district_name, j2.juris_name AS state_name
                FROM pp.jurisdiction j1
                LEFT JOIN pp.jurisdiction j2 ON j1.parent_juris = j2.juris_code
                WHERE j1.juris_name = $1
            `;
            const districtResult = await pool.query(districtQuery, [data.district]);
            const district_name = districtResult.rows[0]?.district_name || null;
            const state_name = districtResult.rows[0]?.state_name || null;

            // Fetch school name
            const schoolResult = await pool.query(
                "SELECT school_name FROM pp.schools WHERE dise_code = $1",
                [data.current_institute_dise_code]
            );
            const school_name = schoolResult.rows[0]?.school_name || null;

            // Prepare insert query
            const query = `
                INSERT INTO pp.applicant_primary_info (
                    nmms_year, nmms_reg_number, app_state, district, district_name, state_name,
                    nmms_block, student_name, father_name, gmat_score, sat_score,
                    contact_no1, contact_no2, current_institute_dise_code,
                    current_institute_name, previous_institute_dise_code, medium,
                    home_address, family_income_total, mother_name, gender, aadhaar, DOB
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
                ) RETURNING *;
            `;

            const values = [
                data.nmms_year || null,
                data.nmms_reg_number || null,
                data.app_state || null,
                data.district || null,
                district_name,
                state_name,
                data.nmms_block || null,
                data.student_name || null,
                data.father_name || null,
                data.gmat_score || null,
                data.sat_score || null,
                data.contact_no1 || null,
                data.contact_no2 || null,
                data.current_institute_dise_code || null,
                school_name,
                data.previous_institute_dise_code || null,
                data.medium || null,
                data.home_address || null,
                data.family_income_total || null,
                data.mother_name || null,
                data.gender || null,
                data.aadhaar || null,
                data.DOB ? new Date(data.DOB).toISOString().split("T")[0] : null
            ];

            const result = await pool.query(query, values);
            return result.rows[0];

        } catch (error) {
            console.error("Error creating applicant:", error.message);
            throw new Error("Failed to create applicant.");
        }
    },

    getAll: async () => {
        try {
            const result = await pool.query("SELECT * FROM pp.applicant_primary_info ORDER BY applicant_id");
            return result.rows;
        } catch (error) {
            console.error("Error fetching applicants:", error.message);
            throw new Error("Failed to fetch applicants.");
        }
    },

    getByRegNumber: async (nmms_reg_number) => {
        try {
            const result = await pool.query(
                "SELECT * FROM pp.applicant_primary_info WHERE nmms_reg_number = $1",
                [nmms_reg_number]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error("Error fetching applicant by reg number:", error.message);
            throw new Error("Failed to fetch applicant.");
        }
    },
    update: async (nmms_reg_number, updatedData) => {
        try {
            const setColumns = Object.keys(updatedData)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(", ");
    
            const values = Object.values(updatedData);
            values.push(nmms_reg_number); // Add nmms_reg_number at the end for the WHERE condition
    
            const query = `
                UPDATE pp.applicant_primary_info
                SET ${setColumns}
                WHERE nmms_reg_number = $${values.length}
                RETURNING *;
            `;
    
            const result = await pool.query(query, values);
            
            if (result.rowCount === 0) {
                return null; // Applicant not found
            }
    
            return result.rows[0]; // Return updated applicant
    
        } catch (error) {
            console.error("Error updating applicant:", error.message);
            throw new Error("Failed to update applicant.");
        }
    },    

    delete: async (nmms_reg_number) => {
        try {
            await pool.query("DELETE FROM pp.applicant_primary_info WHERE nmms_reg_number = $1", [nmms_reg_number]);
            return { message: "Application deleted successfully" };
        } catch (error) {
            console.error("Error deleting applicant:", error.message);
            throw new Error("Failed to delete applicant.");
        }
    }
};

module.exports = Applicant;
