// server/controllers/coordinator/classroomController.js

// Import model function
const {
  getClassroomsByBatch,
} = require("../../models/coordinator/classroomModel");

// Controller: fetch classrooms for a given batch
const fetchClassrooms = async (req, res) => {
  try {
    const { batchId } = req.params;

    if (!batchId) {
      return res.status(400).json({ error: "Batch ID is required" });
    }

    const classrooms = await getClassroomsByBatch(batchId);

    res.json(classrooms);
  } catch (err) {
    console.error("Error fetching classrooms:", err);
    res.status(500).json({ error: "Failed to fetch classrooms" });
  }
};

// Export controller(s)
module.exports = {
  fetchClassrooms,
};
