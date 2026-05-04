const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, authorizeRole('super_admin'), settingsController.getSystemSettings);
router.put('/', authenticateToken, authorizeRole('super_admin'), settingsController.updateSystemSetting);

module.exports = router;
