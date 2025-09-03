const express = require("express");
const router = express.Router();

const {
    getTimeTableByBatch,
    getActiveCohorts,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    getSubjects,
    getTeachers,
    getPlatforms,
} = require("../controllers/timetableController");

router.get("/active-cohorts", getActiveCohorts);


router.get("/:batchId", getTimeTableByBatch);
router.post("/", addTimetableSlot);
router.put("/:slotId", updateTimetableSlot);
router.delete("/:slotId", deleteTimetableSlot);


// --- Routes for Dropdown Data ---
router.get("/data/subjects", getSubjects);
router.get("/data/teachers", getTeachers);
router.get("/data/platforms", getPlatforms);

module.exports = router;
