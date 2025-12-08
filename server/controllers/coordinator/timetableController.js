

// const TimetableModel = require("../../models/coordinator/timetableModel");

// // --------------------------------------------------------------
// // GET TIMETABLE (by batch)
// // --------------------------------------------------------------
// exports.getTimetable = async (req, res) => {
//   try {
//     const batchId = req.query.batchId;
//     if (!batchId) return res.status(400).json({ error: "batchId is required" });

//     const result = await TimetableModel.getTimetableByBatch(batchId);
//     res.json(result);

//   } catch (err) {
//     console.error("GET TIMETABLE ERROR", err);
//     res.status(500).json({ error: "Failed to fetch timetable" });
//   }
// };

// // --------------------------------------------------------------
// // CHECK CONFLICTS  (returns readable alert message)
// // --------------------------------------------------------------
// exports.checkConflict = async (req, res) => {
//   try {
//     const classroomId = req.query.classroomId || req.query.classroom_id;
//     const teacherId = req.query.teacherId || req.query.teacher_id;
//     const day = req.query.day || req.query.dayOfWeek;
//     const startTime = req.query.startTime || req.query.start_time;
//     const endTime = req.query.endTime || req.query.end_time;
//     const excludeId = req.query.excludeId || req.query.exclude_id;

//     const conflicts = await TimetableModel.checkConflicts({
//       classroom_id: classroomId,
//       teacher_id: teacherId,
//       day,
//       start_time: startTime,
//       end_time: endTime,
//       exclude_id: excludeId,
//     });

//     if (conflicts.length > 0) {
//       const c = conflicts[0];

//       return res.status(400).json({
//         overlap: true,
//         message: `Conflict with classroom "${c.classroom_name}" (ID: ${c.classroom_id}) on ${day}, ${c.start_time} - ${c.end_time}`,
//         conflict: c
//       });
//     }

//     return res.json({ overlap: false });

//   } catch (err) {
//     console.error("CHECK CONFLICT ERROR", err);
//     res.status(500).json({ error: "Failed to check conflicts" });
//   }
// };

// // --------------------------------------------------------------
// // CREATE SLOT  (Automatically checks conflicts before insert)
// // --------------------------------------------------------------
// exports.createSlot = async (req, res) => {
//   try {
//     const { batch_id, classroom_id, day, start_time, end_time } = req.body;

//     if (!batch_id || !classroom_id || !day || !start_time || !end_time) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // First check conflicts
//     const conflicts = await TimetableModel.checkConflicts({
//       classroom_id,
//       day,
//       start_time,
//       end_time,
//       teacher_id: null,
//       exclude_id: null
//     });

//     if (conflicts.length > 0) {
//       const c = conflicts[0];
//       return res.status(400).json({
//         success: false,
//         message: `Conflict with classroom "${c.classroom_name}" on ${day} at ${c.start_time} - ${c.end_time}`,
//         conflict: c
//       });
//     }

//     // Create slot only if no conflict
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

//     // Check conflict before updating
//     const conflicts = await TimetableModel.checkConflicts({
//       classroom_id,
//       day,
//       start_time,
//       end_time,
//       teacher_id: null,
//       exclude_id: id
//     });

//     if (conflicts.length > 0) {
//       const c = conflicts[0];
//       return res.status(400).json({
//         success: false,
//         message: `Conflict with classroom "${c.classroom_name}" on ${day}, ${c.start_time} - ${c.end_time}`,
//         conflict: c
//       });
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

/* ============================================================
   GET TIMETABLE (by batch)  — WITH DEBUG LOGS
============================================================ */
exports.getTimetable = async (req, res) => {
  try {
    const batchId = req.query.batchId;

    console.log("\n====== GET TIMETABLE REQUEST ======");
    console.log("Received batchId:", batchId);

    if (!batchId) {
      console.log("❌ Missing batchId in request");
      return res.status(400).json({ error: "batchId is required" });
    }

    const result = await TimetableModel.getTimetableByBatch(batchId);

    console.log("➡️ Timetable result from DB:", result);
    console.log("====================================\n");

    res.json(result);

  } catch (err) {
    console.error("❌ GET TIMETABLE ERROR:", err);
    res.status(500).json({ error: "Failed to fetch timetable" });
  }
};


/* ============================================================
   CHECK CONFLICTS — WITH DEBUG LOGS
============================================================ */
exports.checkConflict = async (req, res) => {
  try {
    console.log("\n====== CHECK CONFLICT REQUEST ======");
    console.log("Query params:", req.query);

    const classroomId = req.query.classroomId || req.query.classroom_id;
    const teacherId = req.query.teacherId || req.query.teacher_id;
    const day = req.query.day || req.query.dayOfWeek;
    const startTime = req.query.startTime || req.query.start_time;
    const endTime = req.query.endTime || req.query.end_time;
    const excludeId = req.query.excludeId || req.query.exclude_id;

    console.log("Parsed conflict check params:", {
      classroomId,
      teacherId,
      day,
      startTime,
      endTime,
      excludeId,
    });

    const conflicts = await TimetableModel.checkConflicts({
      classroom_id: classroomId,
      teacher_id: teacherId,
      day,
      start_time: startTime,
      end_time: endTime,
      exclude_id: excludeId,
    });

    console.log("➡️ Conflicts found:", conflicts);

    if (conflicts.length > 0) {
      const c = conflicts[0];

      console.log("❌ Conflict detected:", c);
      return res.status(400).json({
        overlap: true,
        message: `Conflict with classroom "${c.classroom_name}" (ID: ${c.classroom_id}) on ${day}, ${c.start_time} - ${c.end_time}`,
        conflict: c,
      });
    }

    console.log("✅ No conflict detected");
    return res.json({ overlap: false });

  } catch (err) {
    console.error("❌ CHECK CONFLICT ERROR:", err);
    res.status(500).json({ error: "Failed to check conflicts" });
  }
};


/* ============================================================
   CREATE SLOT — WITH DEBUG LOGS
============================================================ */
exports.createSlot = async (req, res) => {
  try {
    console.log("\n====== CREATE SLOT REQUEST ======");
    console.log("Request body:", req.body);

    const { batch_id, classroom_id, day, start_time, end_time } = req.body;

    if (!batch_id || !classroom_id || !day || !start_time || !end_time) {
      console.log("❌ Missing required fields:", req.body);
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Checking conflicts before creating slot...");
    const conflicts = await TimetableModel.checkConflicts({
      classroom_id,
      day,
      start_time,
      end_time,
      teacher_id: null,
      exclude_id: null,
    });

    console.log("Conflict check result:", conflicts);

    if (conflicts.length > 0) {
      const c = conflicts[0];
      console.log("❌ Cannot create slot due to conflict:", c);

      return res.status(400).json({
        success: false,
        message: `Conflict with classroom "${c.classroom_name}" on ${day} at ${c.start_time} - ${c.end_time}`,
        conflict: c,
      });
    }

    console.log("➡️ No conflict. Creating new slot...");
    const created = await TimetableModel.createSlot({
      batch_id,
      classroom_id,
      day,
      start_time,
      end_time,
    });

    console.log("✅ Slot created:", created);
    res.json({ success: true, data: created });

  } catch (err) {
    console.error("❌ CREATE SLOT ERROR:", err);
    res.status(500).json({ error: "Failed to create timetable slot" });
  }
};


/* ============================================================
   UPDATE SLOT — WITH DEBUG LOGS
============================================================ */
exports.updateSlot = async (req, res) => {
  try {
    console.log("\n====== UPDATE SLOT REQUEST ======");
    console.log("Slot ID:", req.params.id);
    console.log("Request body:", req.body);

    const id = req.params.id;
    const { classroom_id, day, start_time, end_time } = req.body;

    if (!classroom_id || !day || !start_time || !end_time) {
      console.log("❌ Missing required fields for update");
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("Checking conflicts before update...");
    const conflicts = await TimetableModel.checkConflicts({
      classroom_id,
      day,
      start_time,
      end_time,
      teacher_id: null,
      exclude_id: id,
    });

    console.log("Conflict result:", conflicts);

    if (conflicts.length > 0) {
      const c = conflicts[0];
      console.log("❌ Cannot update slot due to conflict:", c);

      return res.status(400).json({
        success: false,
        message: `Conflict with classroom "${c.classroom_name}" on ${day}, ${c.start_time} - ${c.end_time}`,
        conflict: c,
      });
    }

    console.log("➡️ No conflict. Updating slot...");
    const updated = await TimetableModel.updateSlot(id, {
      classroom_id,
      day,
      start_time,
      end_time,
    });

    console.log("✅ Slot updated:", updated);
    res.json({ success: true, data: updated });

  } catch (err) {
    console.error("❌ UPDATE SLOT ERROR:", err);
    res.status(500).json({ error: "Failed to update timetable slot" });
  }
};


/* ============================================================
   DELETE SLOT — WITH DEBUG LOGS
============================================================ */
exports.deleteSlot = async (req, res) => {
  try {
    const id = req.params.id;

    console.log("\n====== DELETE SLOT REQUEST ======");
    console.log("Deleting slot with ID:", id);

    await TimetableModel.deleteSlot(id);

    console.log("✅ Slot deleted:", id);
    res.json({ success: true });

  } catch (err) {
    console.error("❌ DELETE SLOT ERROR:", err);
    res.status(500).json({ error: "Failed to delete timetable slot" });
  }
};
