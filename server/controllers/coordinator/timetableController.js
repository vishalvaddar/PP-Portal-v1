// const TimetableModel = require("../../models/coordinator/timetableModel");

// // --------------------------------------------------------------
// // GET TIMETABLE (by batch)
// // --------------------------------------------------------------
// exports.getTimetable = async (req, res) => {
//   try {
//     const batchId = req.query.batchId;
//     if (!batchId) return res.status(400).json({ error: "batchId is required" });

//     console.log("GET TIMETABLE - batchId:", batchId);

//     const result = await TimetableModel.getTimetableByBatch(batchId);

//     console.log("GET TIMETABLE result:", result);
//     res.json(result);
//   } catch (err) {
//     console.error("GET TIMETABLE ERROR", err);
//     res.status(500).json({ error: "Failed to fetch timetable" });
//   }
// };

// // --------------------------------------------------------------
// // CHECK CONFLICTS
// // --------------------------------------------------------------
// exports.checkConflict = async (req, res) => {
//   try {
//     const classroomId = req.query.classroomId || req.query.classroom_id;
//     const teacherId = req.query.teacherId || req.query.teacher_id;
//     const day = req.query.day || req.query.dayOfWeek;
//     const startTime = req.query.startTime || req.query.start_time;
//     const endTime = req.query.endTime || req.query.end_time;
//     const excludeId = req.query.excludeId || req.query.exclude_id;

//     console.log("CHECK CONFLICT params:", {
//       classroomId,
//       teacherId,
//       day,
//       startTime,
//       endTime,
//       excludeId,
//     });

//     const conflicts = await TimetableModel.checkConflicts({
//       classroom_id: classroomId,
//       teacher_id: teacherId,
//       day,
//       start_time: startTime,
//       end_time: endTime,
//       exclude_id: excludeId,
//     });

//     console.log("CHECK CONFLICT found:", conflicts);

//     if (conflicts.length > 0) {
//       return res.json({ overlap: true, conflicts });
//     }

//     return res.json({ overlap: false });
//   } catch (err) {
//     console.error("CHECK CONFLICT ERROR", err);
//     res.status(500).json({ error: "Failed to check conflicts" });
//   }
// };

// // --------------------------------------------------------------
// // CREATE SLOT
// // --------------------------------------------------------------
// exports.createSlot = async (req, res) => {
//   try {
//     const { batch_id, classroom_id, day, start_time, end_time } = req.body;

//     console.log("CREATE SLOT body:", req.body);

//     if (!batch_id || !classroom_id || !day || !start_time || !end_time) {
//       console.log("CREATE SLOT missing fields:", req.body);
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const created = await TimetableModel.createSlot({
//       batch_id,
//       classroom_id,
//       day,
//       start_time,
//       end_time,
//     });

//     res.json({ success: true, data: created });
//   } catch (err) {
//     console.error("CREATE SLOT ERROR", err);
//     res.status(500).json({ error: "Failed to create timetable slot" });
//   }
// };

// // --------------------------------------------------------------
// // UPDATE SLOT
// // --------------------------------------------------------------
// exports.updateSlot = async (req, res) => {
//   try {
//     const id = req.params.id;
//     const { classroom_id, day, start_time, end_time } = req.body;

//     if (!classroom_id || !day || !start_time || !end_time) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const updated = await TimetableModel.updateSlot(id, {
//       classroom_id,
//       day,
//       start_time,
//       end_time,
//     });

//     res.json({ success: true, data: updated });
//   } catch (err) {
//     console.error("UPDATE SLOT ERROR", err);
//     res.status(500).json({ error: "Failed to update timetable slot" });
//   }
// };

// // --------------------------------------------------------------
// // DELETE SLOT
// // --------------------------------------------------------------
// exports.deleteSlot = async (req, res) => {
//   try {
//     const id = req.params.id;
//     await TimetableModel.deleteSlot(id);
//     res.json({ success: true });
//   } catch (err) {
//     console.error("DELETE SLOT ERROR", err);
//     res.status(500).json({ error: "Failed to delete timetable slot" });
//   }
// };

const TimetableModel = require("../../models/coordinator/timetableModel");

// --------------------------------------------------------------
// GET TIMETABLE (by batch)
// --------------------------------------------------------------
exports.getTimetable = async (req, res) => {
  try {
    const batchId = req.query.batchId;
    if (!batchId) return res.status(400).json({ error: "batchId is required" });

    const result = await TimetableModel.getTimetableByBatch(batchId);
    res.json(result);

  } catch (err) {
    console.error("GET TIMETABLE ERROR", err);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
};

// --------------------------------------------------------------
// CHECK CONFLICTS  (returns readable alert message)
// --------------------------------------------------------------
exports.checkConflict = async (req, res) => {
  try {
    const classroomId = req.query.classroomId || req.query.classroom_id;
    const teacherId = req.query.teacherId || req.query.teacher_id;
    const day = req.query.day || req.query.dayOfWeek;
    const startTime = req.query.startTime || req.query.start_time;
    const endTime = req.query.endTime || req.query.end_time;
    const excludeId = req.query.excludeId || req.query.exclude_id;

    const conflicts = await TimetableModel.checkConflicts({
      classroom_id: classroomId,
      teacher_id: teacherId,
      day,
      start_time: startTime,
      end_time: endTime,
      exclude_id: excludeId,
    });

    if (conflicts.length > 0) {
      const c = conflicts[0];

      return res.status(400).json({
        overlap: true,
        message: `Conflict with classroom "${c.classroom_name}" (ID: ${c.classroom_id}) on ${day}, ${c.start_time} - ${c.end_time}`,
        conflict: c
      });
    }

    return res.json({ overlap: false });

  } catch (err) {
    console.error("CHECK CONFLICT ERROR", err);
    res.status(500).json({ error: "Failed to check conflicts" });
  }
};

// --------------------------------------------------------------
// CREATE SLOT  (Automatically checks conflicts before insert)
// --------------------------------------------------------------
exports.createSlot = async (req, res) => {
  try {
    const { batch_id, classroom_id, day, start_time, end_time } = req.body;

    if (!batch_id || !classroom_id || !day || !start_time || !end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // First check conflicts
    const conflicts = await TimetableModel.checkConflicts({
      classroom_id,
      day,
      start_time,
      end_time,
      teacher_id: null,
      exclude_id: null
    });

    if (conflicts.length > 0) {
      const c = conflicts[0];
      return res.status(400).json({
        success: false,
        message: `Conflict with classroom "${c.classroom_name}" on ${day} at ${c.start_time} - ${c.end_time}`,
        conflict: c
      });
    }

    // Create slot only if no conflict
    const created = await TimetableModel.createSlot({
      batch_id,
      classroom_id,
      day,
      start_time,
      end_time,
    });

    res.json({ success: true, data: created });

  } catch (err) {
    console.error("CREATE SLOT ERROR", err);
    res.status(500).json({ error: "Failed to create timetable slot" });
  }
};

// --------------------------------------------------------------
// UPDATE SLOT
// --------------------------------------------------------------
exports.updateSlot = async (req, res) => {
  try {
    const id = req.params.id;
    const { classroom_id, day, start_time, end_time } = req.body;

    if (!classroom_id || !day || !start_time || !end_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check conflict before updating
    const conflicts = await TimetableModel.checkConflicts({
      classroom_id,
      day,
      start_time,
      end_time,
      teacher_id: null,
      exclude_id: id
    });

    if (conflicts.length > 0) {
      const c = conflicts[0];
      return res.status(400).json({
        success: false,
        message: `Conflict with classroom "${c.classroom_name}" on ${day}, ${c.start_time} - ${c.end_time}`,
        conflict: c
      });
    }

    const updated = await TimetableModel.updateSlot(id, {
      classroom_id,
      day,
      start_time,
      end_time,
    });

    res.json({ success: true, data: updated });

  } catch (err) {
    console.error("UPDATE SLOT ERROR", err);
    res.status(500).json({ error: "Failed to update timetable slot" });
  }
};

// --------------------------------------------------------------
// DELETE SLOT
// --------------------------------------------------------------
exports.deleteSlot = async (req, res) => {
  try {
    const id = req.params.id;
    await TimetableModel.deleteSlot(id);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE SLOT ERROR", err);
    res.status(500).json({ error: "Failed to delete timetable slot" });
  }
};
