const studentModel = require("../models/studentSearchModel");

const studentSearchController = async (req, res) => {
  try {
    const result = await studentModel.searchStudents(req.query);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page: Math.floor(result.offset / result.limit) + 1,
        totalPages: Math.ceil(result.total / result.limit),
        hasMore: result.offset + result.limit < result.total,
      },
    });
  } catch (error) {
    console.error("Student search error:", error);
    res.status(500).json({
      success: false,
      error: "Internal Server Error",
    });
  }
};

/* =========================================================
   GET STUDENT BY ID CONTROLLER
========================================================= */
const getStudentById = async (req, res) => {
  try {
    const student = await studentModel.getStudentById(req.params.student_id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ success: false });
  }
};

module.exports = {
  studentSearchController,
  getStudentById,
};
