const Applicant = require("../models/applicantModel");

const createApplicant = async (req, res) => {
    try {
        const requiredFields = [
            "nmms_year", "nmms_reg_number", "student_name", "father_name",
            "medium", "contact_no1", "contact_no2", "nmms_district",
            "nmms_block", "current_institute", "gmat_score", "sat_score"
        ];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({ error: `${field} is required.` });
            }
        }

        const newApplicant = await Applicant.create(req.body);
        res.status(200).json({ message: "Application submitted successfully", data: newApplicant });
    } catch (error) {
        console.error("Error inserting data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { createApplicant };
