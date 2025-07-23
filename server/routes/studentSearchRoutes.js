// studentSearchRoutes.js

const express = require('express');
const router = express.Router();
const { studentSearchController } = require('../controllers/studentSearchController');

// Define the route for student search
router.get('/search-students', studentSearchController);

module.exports = router;