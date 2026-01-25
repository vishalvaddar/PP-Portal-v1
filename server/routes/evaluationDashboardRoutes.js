const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/evaluationDashboardController');

// 💡 ADDED :year TO ALL ROUTES
// This allows req.params.year to be captured by the controller
router.get('/overall/:year', DashboardController.getOverallCounts);
router.get('/jurisdictions/:year', DashboardController.getJurisdictionalProgress);
router.get('/overall-progress/:year', DashboardController.getOverallProgress);

module.exports = router;