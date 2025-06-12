const express = require('express');
const router = express.Router();

// Define routes for Coordinator
router.get('/', (req, res) => {
  res.send('Coordinator Home');
});

module.exports = router;