const express = require('express');
const router = express.Router();
const controller = require('../controllers/customListController');

// GET Routes
router.get('/lists', controller.getAllLists);
router.get('/batches', controller.getAllBatches);
router.get('/available-fields', controller.getAvailableFields);
router.get('/students-by-list/:listId', controller.getStudentsByListId);
router.get('/students-by-cohort/:cohortId', controller.getStudentsByCohort);
router.get('/download-pdf/:listId', controller.downloadListPDF);
router.get('/download-xlsx/:listId', controller.downloadListXLS);
// POST & DELETE Routes
router.post('/save-list-full', controller.saveListFull);
router.delete('/list/:id', controller.deleteList);

module.exports = router;