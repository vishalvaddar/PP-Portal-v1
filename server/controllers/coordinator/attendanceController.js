// const {
//   getAttendanceByFilters,
//   createBulkAttendance,
//   processCSVAttendance,
// } = require("../../models/coordinator/attendanceModel");
// const fs = require("fs");
// const path = require("path");

// // ----------------------------
// // Fetch attendance (by cohort, batch, classroom, date, time)
// // ----------------------------
// const fetchAttendance = async (req, res) => {
//   try {
//     // ✅ Use query params from the frontend request
//     // Fix: Changed cohortId to cohortNumber to match the model
//     const { cohortNumber, batchId, classroomId, date, startTime, endTime } = req.query;

//     if (!cohortNumber && !batchId && !classroomId && !date) {
//       return res.status(400).json({
//         message: "At least one filter (cohortNumber, batchId, classroomId, date) is required",
//       });
//     }

//     // Corrected: Create a single filters object to pass to the model function
//     const filters = {
//       // Fix: Use cohortNumber here
//       cohortNumber: cohortNumber ? parseInt(cohortNumber) : null,
//       batchId: batchId ? parseInt(batchId) : null,
//       classroomId: classroomId ? parseInt(classroomId) : null,
//       date: date || null,
//       startTime: startTime || null,
//       endTime: endTime || null,
//     };

//     const data = await getAttendanceByFilters(filters);

//     res.status(200).json(data || []);
//   } catch (err) {
//     console.error("Error fetching attendance:", err);
//     res.status(500).json({ message: "Error fetching attendance", error: err.message });
//   }
// };

// // ----------------------------
// // Bulk attendance upload via JSON
// // ----------------------------
// const submitBulkAttendance = async (req, res) => {
//   try {
//     const { attendanceRecords } = req.body;

//     if (!attendanceRecords || !attendanceRecords.length) {
//       return res.status(400).json({ message: "No attendance records provided" });
//     }

//     const inserted = await createBulkAttendance(attendanceRecords);
//     res.status(201).json({ message: "Attendance uploaded", inserted });
//   } catch (err) {
//     console.error("Error uploading attendance:", err);
//     res.status(500).json({ message: "Error uploading attendance", error: err.message });
//   }
// };

// // ----------------------------
// // Bulk attendance upload via CSV
// // ----------------------------
// const uploadCSVAttendance = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "CSV file not provided" });
//     }

//     const { classroom_id, date, teacherStartTime, teacherEndTime } = req.body;

//     if (!classroom_id || !date || !teacherStartTime || !teacherEndTime) {
//       return res.status(400).json({ message: "Required form data missing" });
//     }

//     const filePath = path.join(__dirname, "../../uploads", req.file.filename);

//     const { inserted, errors } = await processCSVAttendance(
//       filePath,
//       parseInt(classroom_id),
//       date,
//       teacherStartTime,
//       teacherEndTime
//     );

//     // Delete uploaded CSV after processing
//     fs.unlinkSync(filePath);

//     res.status(201).json({ message: "CSV attendance processed", inserted, errors });
//   } catch (err) {
//     console.error("Error processing CSV attendance:", err);
//     res.status(500).json({ message: "Error processing CSV attendance", error: err.message });
//   }
// };

// // ----------------------------
// // Download sample CSV
// // ----------------------------
// const downloadSampleCSV = (req, res) => {
//   const filePath = path.join(__dirname, "../../uploads/sample_attendance.csv");
//   res.download(filePath, "sample_attendance.csv", (err) => {
//     if (err) {
//       console.error("Error sending sample CSV:", err);
//       res.status(500).send("Could not download sample CSV");
//     }
//   });
// };

// module.exports = {
//   fetchAttendance,
//   submitBulkAttendance,
//   uploadCSVAttendance,
//   downloadSampleCSV,
// };


const {
  getAttendanceByFilters,
  createBulkAttendance,
  processCSVAttendance,
  getStudentsByClassroom, // 👈 new model function: fetch students
} = require("../../models/coordinator/attendanceModel");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

// ----------------------------
// Fetch attendance (by cohort, batch, classroom, date, time)
// ----------------------------
const fetchAttendance = async (req, res) => {
  try {
    const { cohortNumber, batchId, classroomId, date, startTime, endTime } = req.query;

    if (!cohortNumber && !batchId && !classroomId && !date) {
      return res.status(400).json({
        message:
          "At least one filter (cohortNumber, batchId, classroomId, date) is required",
      });
    }

    const filters = {
      cohortNumber: cohortNumber ? parseInt(cohortNumber) : null,
      batchId: batchId ? parseInt(batchId) : null,
      classroomId: classroomId ? parseInt(classroomId) : null,
      date: date || null,
      startTime: startTime || null,
      endTime: endTime || null,
    };

    const data = await getAttendanceByFilters(filters);

    res.status(200).json(data || []);
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res
      .status(500)
      .json({ message: "Error fetching attendance", error: err.message });
  }
};

// ----------------------------
// Bulk attendance upload via JSON (manual + bulk submit)
// ----------------------------
const submitBulkAttendance = async (req, res) => {
  try {
    const { attendanceRecords } = req.body;

    if (!attendanceRecords || !attendanceRecords.length) {
      return res.status(400).json({ message: "No attendance records provided" });
    }

    const inserted = await createBulkAttendance(attendanceRecords);
    res.status(201).json({ message: "Attendance uploaded", inserted });
  } catch (err) {
    console.error("Error uploading attendance:", err);
    res
      .status(500)
      .json({ message: "Error uploading attendance", error: err.message });
  }
};

// ----------------------------
// CSV Upload → Preview only (no DB insert yet)
// ----------------------------
const previewCSVAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file not provided" });
    }

    const { classroom_id, date, teacherStartTime, teacherEndTime } = req.body;

    if (!classroom_id || !date || !teacherStartTime || !teacherEndTime) {
      return res.status(400).json({ message: "Required form data missing" });
    }

    const filePath = path.join(__dirname, "../../uploads", req.file.filename);

    const { inserted, errors } = await processCSVAttendance(
      filePath,
      parseInt(classroom_id),
      date,
      teacherStartTime,
      teacherEndTime
    );

    fs.unlinkSync(filePath);

    res.status(200).json({ preview: inserted, errors });
  } catch (err) {
    console.error("Error previewing CSV attendance:", err);
    res
      .status(500)
      .json({ message: "Error previewing CSV attendance", error: err.message });
  }
};

// ----------------------------
// Old CSV upload → auto insert (direct commit)
// ----------------------------
const uploadCSVAttendance = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file not provided" });
    }

    const { classroom_id, date, teacherStartTime, teacherEndTime } = req.body;

    if (!classroom_id || !date || !teacherStartTime || !teacherEndTime) {
      return res.status(400).json({ message: "Required form data missing" });
    }

    const filePath = path.join(__dirname, "../../uploads", req.file.filename);

    const { inserted, errors } = await processCSVAttendance(
      filePath,
      parseInt(classroom_id),
      date,
      teacherStartTime,
      teacherEndTime
    );

    fs.unlinkSync(filePath);

    res.status(201).json({ message: "CSV attendance processed", inserted, errors });
  } catch (err) {
    console.error("Error processing CSV attendance:", err);
    res
      .status(500)
      .json({ message: "Error processing CSV attendance", error: err.message });
  }
};

// ----------------------------
// Download Reference CSV with student names
// ----------------------------
const downloadReferenceCSV = async (req, res) => {
  try {
    const { classroomId } = req.query;

    if (!classroomId) {
      return res.status(400).json({ message: "classroomId is required" });
    }

    const students = await getStudentsByClassroom(parseInt(classroomId));

    const fields = ["STUDENT NAME", "TIME JOINED", "TIME EXITED"];
    const data = students.map((s) => ({
      "STUDENT NAME": s.name,
      "TIME JOINED": "",
      "TIME EXITED": "",
    }));

    const parser = new Parser({ fields });
    const csvData = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("reference_attendance.csv");
    return res.send(csvData);
  } catch (err) {
    console.error("Error generating reference CSV:", err);
    res.status(500).json({ message: "Failed to generate reference CSV" });
  }
};

// ----------------------------
// Download processed report (after upload)
// ----------------------------
const downloadAttendanceReport = async (req, res) => {
  try {
    const reportPath = path.join(__dirname, "../../uploads/attendance_report.json");

    if (!fs.existsSync(reportPath)) {
      return res.status(404).json({ message: "No report found. Upload attendance first." });
    }

    const report = JSON.parse(fs.readFileSync(reportPath));

    const fields = ["STUDENT NAME", "TIME JOINED", "TIME EXITED", "STATUS"];
    const data = report.map((r) => ({
      "STUDENT NAME": r.name,
      "TIME JOINED": r.joined,
      "TIME EXITED": r.exited,
      STATUS: r.status,
    }));

    const parser = new Parser({ fields });
    const csvData = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("attendance_report.csv");
    return res.send(csvData);
  } catch (err) {
    console.error("Error downloading attendance report:", err);
    res.status(500).json({ message: "Failed to download report" });
  }
};

module.exports = {
  fetchAttendance,
  submitBulkAttendance,
  previewCSVAttendance,
  uploadCSVAttendance,
  downloadReferenceCSV,      // 👈 generate reference file
  downloadAttendanceReport,  // 👈 download processed report
};
