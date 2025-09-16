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
    getBatchesByCohort, 
    addSubject, 
    addPlatform, 
    deleteSubject, 
    deletePlatform
} = require("../controllers/timetableController");

router.get("/active-cohorts", getActiveCohorts);


router.get("/:batchId", getTimeTableByBatch);
router.post("/", addTimetableSlot);
router.put("/:slotId", updateTimetableSlot);
router.delete("/:slotId", deleteTimetableSlot);
router.get("/:cohort", getBatchesByCohort);


// --- Routes for Dropdown Data ---
router.get("/data/subjects", getSubjects);
router.get("/data/teachers", getTeachers);
router.get("/data/platforms", getPlatforms);
router.post("/data/subjects", addSubject);
router.post("/data/platforms", addPlatform);
router.delete("/data/subjects/:id", deleteSubject);
router.delete("/data/platforms/:id", deletePlatform);

module.exports = router;
