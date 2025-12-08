// // Import model functions
// const {
//   getStudentsByCohortAndBatch,
//   getAllStudents,
// } = require("../../models/coordinator/studentModel");

// // Controller to fetch students
// const getStudentsController = async (req, res) => {
//   try {
//     const { cohortNumber, batchId } = req.query;

//     let students;

//     if (cohortNumber && batchId) {
//       students = await getStudentsByCohortAndBatch(cohortNumber, batchId);
//     } else {
//       students = await getAllStudents();
//     }

//     res.json(students);
//   } catch (err) {
//     console.error("Error fetching students:", err);
//     res.status(500).json({ error: "Failed to fetch students" });
//   }
// };

// // Export controller(s)
// module.exports = {
//   getStudentsController,
// };
// server/controllers/coordinator/studentController.js

const {
  getStudentsByCohortAndBatch,
  getStudentsByCoordinator,
  updateStudentModel,
  markStudentInactiveModel,
  getInactiveHistoryByStudentId
} = require("../../models/coordinator/studentModel");


/* ===========================================================
   1) GET STUDENTS (Filtered for coordinator)
   =========================================================== */
const getStudentsController = async (req, res) => {
  try {
    const { cohortNumber, batchId } = req.query;
    const user_id = req.user.user_id;

    let students = [];

    // 1️⃣ Cohort + Batch → fetch exactly that batch
    if (cohortNumber && batchId) {
      students = await getStudentsByCohortAndBatch(cohortNumber, batchId);
      return res.json(students);
    }

    // 2️⃣ Only cohort selected → filter coordinator’s students
    if (cohortNumber && !batchId) {
      const rows = await getStudentsByCoordinator(user_id);
      students = rows.filter(s => s.cohort_number == cohortNumber);
      return res.json(students);
    }

    // 3️⃣ Default: only coordinator's assigned students
    students = await getStudentsByCoordinator(user_id);
    return res.json(students);

  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};


/* ===========================================================
   2) UPDATE STUDENT
   =========================================================== */
const updateStudentController = async (req, res) => {
  try {
    const student_id = req.params.id;
    const payload = req.body;

    await updateStudentModel(student_id, payload);

    return res.json({ message: "Student updated successfully" });
  } catch (err) {
    console.error("Update student failed:", err);
    return res.status(500).json({ error: "Failed to update student" });
  }
};


/* ===========================================================
   3) MARK STUDENT INACTIVE
   =========================================================== */
const markInactiveController = async (req, res) => {
  try {
    const student_id = req.params.id;
    const { inactive_reason } = req.body;
    const user_id = req.user.user_id;

    if (!inactive_reason || inactive_reason.trim() === "") {
      return res.status(400).json({ error: "Inactive reason is required" });
    }

    await markStudentInactiveModel(student_id, inactive_reason, user_id);

    return res.json({ message: "Student marked inactive successfully" });
  } catch (err) {
    console.error("Error marking inactive:", err);
    return res.status(500).json({ error: "Failed to mark student inactive" });
  }
};


/* ===========================================================
   4) GET INACTIVE HISTORY FOR A STUDENT
   =========================================================== */
const getInactiveHistoryController = async (req, res) => {
  try {
    const student_id = req.params.id;

    const rows = await getInactiveHistoryByStudentId(student_id);

    return res.json(rows);
  } catch (err) {
    console.error("Error fetching inactive history:", err);
    return res.status(500).json({ error: "Failed to fetch inactive history" });
  }
};


module.exports = {
  getStudentsController,
  updateStudentController,
  markInactiveController,
  getInactiveHistoryController
};
