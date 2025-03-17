const Applicant = require("../models/applicantModel");

const viewApplicants = async (req, res) => {
    try {
        const applicants = await Applicant.getAll();
        res.json(applicants);
    } catch (error) {
        console.error("Error fetching applicants:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { viewApplicants };
