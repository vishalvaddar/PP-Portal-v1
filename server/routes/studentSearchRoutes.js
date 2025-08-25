const express = require('express');
const router = express.Router();
const { studentSearchController, advancedStudentSearch, getStudentById } = require('../controllers/studentSearchController');

router.get('/search-students', studentSearchController);
router.get('/advanced-search-students', advancedStudentSearch);
router.get('/student/:student_id', getStudentById);

module.exports = router;