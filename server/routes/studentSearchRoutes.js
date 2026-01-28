const express = require('express');
const router = express.Router();
const { studentSearchController, getStudentById } = require('../controllers/studentSearchController');

router.get('/search-students', studentSearchController);
router.get('/student/:student_id', getStudentById);

module.exports = router;