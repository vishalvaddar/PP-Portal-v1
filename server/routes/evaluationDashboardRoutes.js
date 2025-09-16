const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/evaluationDashboardController');

router.get('/overall', DashboardController.getOverallCounts);
router.get('/jurisdictions', DashboardController.getJurisdictionalProgress);
router.get('/overall-progress', DashboardController.getOverallProgress);

module.exports = router;
