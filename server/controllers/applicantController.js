const Applicant = require("../models/applicantModel");

const createApplicant = async (req, res) => {
    try {
        const newApplicant = await Applicant.create(req.body);
        res.status(201).json({ message: "Applicant created successfully", applicant: newApplicant });
    } catch (error) {
        console.error("Error creating applicant:", error.message);

        // Handle missing field errors
        if (error.message.startsWith("Missing required field")) {
            return res.status(400).json({ error: error.message });
        }

        // Handle duplicate NMMS registration number
        if (error.message.includes("Student already exists")) {
            return res.status(409).json({ error: error.message });
        }

        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { createApplicant };