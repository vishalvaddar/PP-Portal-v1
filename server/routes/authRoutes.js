const express = require('express');
const router = express.Router();
const loginController = require('../controllers/loginController');
const authorizeRoleController = require('../controllers/authorizeRoleController');

router.post('/login', loginController);
router.post('/authorize-role', authorizeRoleController);

module.exports = router;
