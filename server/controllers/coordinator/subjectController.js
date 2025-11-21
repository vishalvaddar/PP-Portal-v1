// server/controllers/coordinator/subjectController.js

// Correct relative path: from controllers/coordinator -> models/coordinator
const Subject = require("../../models/coordinator/subjectModel");

// Controller function to fetch all subjects
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.getAllSubjects();
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Proper export
module.exports = { getSubjects };
