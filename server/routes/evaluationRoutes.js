const express = require("express");

const router = express.Router();

const{fetchExamNames,fetchStudents,downloadStudentExcel,uploadBulkData,
  upload} =require('../controllers/evaluationController')

router.get("/exam_names",fetchExamNames)
router.get("/exam_names", fetchStudents);
router.post("/download_excel", downloadStudentExcel);
router.post('/bulk-upload', upload.single('excelFile'), uploadBulkData);

module.exports = router;