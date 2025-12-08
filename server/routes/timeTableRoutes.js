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

router.get("/cohorts/active", getActiveCohorts);
router.get("/cohorts/:cohortId/batches", getBatchesByCohort);

router.get("/batch/:batchId", getTimeTableByBatch);

router.post("/", addTimetableSlot);
router.put("/:slotId", updateTimetableSlot);
router.delete("/:slotId", deleteTimetableSlot);

router.get("/data/subjects", getSubjects);
router.post("/data/subjects", addSubject);
router.delete("/data/subjects/:id", deleteSubject);

router.get("/data/teachers", getTeachers);

router.get("/data/platforms", getPlatforms);
router.post("/data/platforms", addPlatform);
router.delete("/data/platforms/:id", deletePlatform);

module.exports = router;
