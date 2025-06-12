const Applicant = require("../models/applicantModel");

const updateApplicant = async (req, res) => {
    const { applicant_id } = req.params;
    const { primaryData, secondaryData } = req.body;

    if (!primaryData) {
        return res.status(400).json({ message: "primaryData is missing in the request body." });
    }

    try {

        const updatedApplicant = await Applicant.update(applicant_id, primaryData, secondaryData);

        if (!updatedApplicant) {
            return res.status(404).json({ message: "Applicant not found" });
        }

        res.json({
            message: "Applicant updated successfully",
            data: updatedApplicant
        });
    } catch (error) {
        console.error("Error updating applicant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = { updateApplicant };
