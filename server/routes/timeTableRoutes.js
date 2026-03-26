const express = require("express");
const router = express.Router();

const {
    getTimeTableByBatch,
    getActiveCohorts,
    addTimetableSlot,
    updateTimetableSlot,
    deleteTimetableSlot,
    getSubjects,
    getSubjectsForTimeTable,
    getTeachersForTimeTable,
    getTeachers,
    getPlatforms,
    getBatchesByCohort,
    addSubject,
    addPlatform,
    deleteSubject,
    deletePlatform,
    getBatchesByGrades,
    getCanTeachByTeacherIds,
    generateFinalOutputFromPython,
    getSubjectsByteacher,
    getTeachersBySubjects,
    getBatchesByGradeMediumAndSubjectIds,
    saveConfigurationDraftFile,
    getAllConfigurationDraftFileDtls
    
} = require("../controllers/timetableController");

router.get("/cohorts/active", getActiveCohorts);
router.get("/cohorts/:cohortId/batches", getBatchesByCohort);

router.get("/batch/:batchId", getTimeTableByBatch);

router.post("/", addTimetableSlot);
router.put("/:slotId", updateTimetableSlot);
router.delete("/:slotId", deleteTimetableSlot);

router.get("/data/subjects", getSubjects);
router.get("/data/subjectsForTimeTable", getSubjectsForTimeTable);
router.get("/data/teachersForTimeTable", getTeachersForTimeTable);

router.post("/data/subjects", addSubject);
router.delete("/data/subjects/:id", deleteSubject);

router.get("/data/teachers", getTeachers);

router.get("/data/platforms", getPlatforms);
router.post("/data/platforms", addPlatform);
router.delete("/data/platforms/:id", deletePlatform);

router.post("/batches/byGrades", getBatchesByGrades);
router.post("/teachers/canTeachByIds", getCanTeachByTeacherIds);
router.post("/generate", generateFinalOutputFromPython);
router.post("/teachers/getSubjectsByteacher", getSubjectsByteacher);
router.post("/teachers/getTeachersBySubjects", getTeachersBySubjects);
router.post("/batches/getBatchesByGradeMediumAndSubjectIds", getBatchesByGradeMediumAndSubjectIds);
router.post("/timeTable/saveConfigurationDraftFile", saveConfigurationDraftFile);
router.post("/timeTable/getAllConfigurationDraftFileDtls", getAllConfigurationDraftFileDtls);








module.exports = router;
