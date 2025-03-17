const Applicant = require("../models/applicantModel");

const updateApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedApplicant = await Applicant.update(id, req.body);
        res.json({ message: "Application updated successfully", applicant: updatedApplicant });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { updateApplicant };
