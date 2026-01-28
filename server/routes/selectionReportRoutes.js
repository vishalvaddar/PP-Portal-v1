const express = require('express');
const router = express.Router();
const controller = require('../controllers/selectionReportsController');

// Existing Routes
router.get('/init', controller.getInitialData);
router.get('/nmms-data', controller.getNMMSData);
router.post('/download-pdf', controller.downloadNMMSPDF); 
 
// Route to fetch the Appeared vs Called data
router.get('/turnout-data', controller.getTurnOutData);

// Route to handle the Turn-Out PDF generation
router.post('/download-turnout-pdf', controller.downloadTurnOutPDF);

router.get('/selection-data', controller.getSelectionData);
router.post('/download-selection-pdf', controller.downloadSelectionPDF);

// Route to fetch gender-wise selection data
router.get('/selects-data', controller.getSelectsData);

router.post('/download-selects-pdf', controller.downloadSelectsPDF);

// --- NEW ROUTES FOR SAMMELAN REPORTS ---
// Route to fetch cohorts for the dropdown menu
router.get('/cohorts', controller.getCohorts);

// Route to fetch Sammelan attendance data based on cohort and dates
router.get('/sammelan-data', controller.getSammelanData);

// Route to handle Sammelan PDF generation
router.post('/download-sammelan', controller.downloadSammelanPDF);

module.exports = router;