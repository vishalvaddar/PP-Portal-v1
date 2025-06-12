const express = require('express');
const router = express.Router();

// Define routes for the AdminDashboard
router.get('/', (req, res) => {
  res.send('Admin Dashboard Home');
});

router.get('/settings', (req, res) => {
  res.send('Admin Dashboard Settings');
});

router.get('/users', (req, res) => {
  res.send('Admin Dashboard Users');
});

module.exports = router;