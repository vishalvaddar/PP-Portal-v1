const { getAllStudents, getStudentsByCohort } = require("../../models/coordinator/studentModel");

const fetchStudentsByCohort = async (req, res) => {
  try {
    const { cohortId } = req.params;
    const students = await getStudentsByCohort(cohortId);
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};
