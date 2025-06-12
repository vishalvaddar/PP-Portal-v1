const express = require('express');
const router = express.Router();

// Define routes for Student
router.get('/', (req, res) => {
  res.send('Student Home');
});

module.exports = router;