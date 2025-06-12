const Applicant = require("../models/applicantModel");

// Fetch all applicants
const viewApplicants = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || "applicant_id";
        const sortOrder = req.query.sortOrder || "ASC";
        // Extract all filter parameters
        const filters = {
            nmms_year: req.query.nmms_year,
            nmms_reg_number: req.query.nmms_reg_number,
            student_name: req.query.student_name,
            medium: req.query.medium,
            district: req.query.district,
            nmms_block: req.query.nmms_block,
            app_state: req.query.app_state,
            current_institute_dise_code: req.query.current_institute_dise_code,
            search: req.query.search || ""
        };

        //get paginated data
        const result = await Applicant.getAll(page, limit, sortBy, sortOrder, filters);
        res.json(result); // Return the paginated data
        console.log(result);

    } catch (error) {
        console.error("Error fetching applicants:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Fetch a single applicant by nmms_reg_number
const viewApplicantByRegNumber = async (req, res) => {
    const { nmms_reg_number } = req.params;

    // Simple validation for nmms_reg_number format
    if (!nmms_reg_number || typeof nmms_reg_number !== 'string' || nmms_reg_number.trim().length === 0) {
        return res.status(400).json({ error: "Invalid nmms_reg_number format" });
    }

    try {
        const applicant = await Applicant.getByRegNumber(nmms_reg_number);

        if (!applicant) {
            return res.status(404).json({ error: "Student not found" });
        }

        res.json(applicant);  // Return the applicant data (primary and secondary)
    } catch (error) {
        console.error("Error fetching applicant:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Fetch secondary applicant by nmms_reg_number
const viewSecondaryApplicantByRegNumber = async (req, res) => {
    const { nmms_reg_number } = req.params;

    // Simple validation for nmms_reg_number format
    if (!nmms_reg_number || typeof nmms_reg_number !== 'string' || nmms_reg_number.trim().length === 0) {
        return res.status(400).json({ error: "Invalid nmms_reg_number format" });
    }

    try {
        // Assuming you have a method to fetch secondary applicant data
        const secondaryApplicant = await Applicant.getSecondaryByRegNumber(nmms_reg_number);

        if (!secondaryApplicant) {
            return res.status(404).json({ error: "Secondary applicant not found" });
        }

        res.json(secondaryApplicant);
    } catch (error) {
        console.error("Error fetching secondary applicant:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = { viewApplicants, viewApplicantByRegNumber, viewSecondaryApplicantByRegNumber };
