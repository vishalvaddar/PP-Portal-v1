const Applicant = require("../models/applicantModel");

const updateApplicant = async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const updatedApplicant = await Applicant.update(id, updatedData);
        if (!updatedApplicant) {
            return res.status(404).json({ message: "Applicant not found" });
        }
        res.json({ message: "Applicant updated successfully", data: updatedApplicant });  //data is send 
    } catch (error) {
        console.error("Error updating applicant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { updateApplicant };
