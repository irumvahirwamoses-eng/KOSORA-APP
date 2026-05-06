const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', applicationController.submitApplication);
router.get('/', authenticateToken, authorizeRole('super_admin'), applicationController.getAllApplications);
router.get('/:id', authenticateToken, authorizeRole('super_admin'), applicationController.getApplication);
router.patch('/:id/status', authenticateToken, authorizeRole('super_admin'), applicationController.updateApplicationStatus);
router.delete('/:id', authenticateToken, authorizeRole('super_admin'), applicationController.deleteApplication);

module.exports = router;
