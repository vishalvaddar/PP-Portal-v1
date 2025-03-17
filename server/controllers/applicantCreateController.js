
const Applicant = require("../models/applicantModel");

const createApplicant = async (req, res) => {
    try {
        const newApplicant = await Applicant.create(req.body);
        res.status(201).json({ message: "Applicant created successfully", applicant: newApplicant });
    } catch (error) {
        console.error("Error creating applicant:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { createApplicant };
