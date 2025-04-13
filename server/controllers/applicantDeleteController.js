const Applicant = require("../models/applicantModel");

const deleteApplicant = async (req, res) => {
    try {
        const { id } = req.params;
        await Applicant.delete(id);
        res.json({ message: "Application deleted successfully" });
    } catch (error) {
        console.error("Error deleting application:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { deleteApplicant };
