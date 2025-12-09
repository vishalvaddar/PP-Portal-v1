const express = require('express');
const router = express.Router();
const controller = require('../controllers/customListController');

// GET Routes
router.get('/lists', controller.getAllLists);
router.get('/students-by-cohort/:cohortId', controller.getStudentsByCohort);
router.get('/students-by-list/:listId', controller.getStudentsByListId);

// POST Routes
router.post('/create-list-with-students', controller.createListWithStudents);

// PUT Routes
router.put('/list/:id', controller.updateListName);

// DELETE Routes
router.delete('/list/:id', controller.deleteList);
// ... existing routes

// Add students to an existing list
router.post('/add-students', controller.addStudentsToList);

// Remove a specific student from a list
router.delete('/list/:listId/student/:studentId', controller.removeStudentFromList);

module.exports = router;