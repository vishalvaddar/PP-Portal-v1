const Applicant = require("../models/applicantModel");

// Fetch all applicants
const viewApplicants = async (req, res) => {
    try {
        const applicants = await Applicant.getAll();
        res.json(applicants);
    } catch (error) {
        console.error("Error fetching applicants:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Fetch a single applicant by nmms_reg_number
const viewApplicantByRegNumber = async (req, res) => {
    const { nmms_reg_number } = req.params;
    try{
        const applicant = await Applicant.getByRegNumber(nmms_reg_number);

        if(!applicant) {
            return res.status(404).json({error: "Student not found"});
        }

        res.json(applicant)
    } catch(error) {
        console.error("error fetching applicant", error);
        res.status(500).json({error: "Internal server error"});
    }
}
module.exports = { viewApplicants, viewApplicantByRegNumber };
