const express = require('express');
const router = express.Router();
const schoolController = require('../controllers/schoolController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole('super_admin'), schoolController.createSchool);
router.get('/', authenticateToken, authorizeRole('super_admin'), schoolController.getAllSchools);
router.get('/:id', authenticateToken, authorizeRole('super_admin'), schoolController.getSchool);
router.put('/:id', authenticateToken, authorizeRole('super_admin'), schoolController.updateSchool);
router.delete('/:id', authenticateToken, authorizeRole('super_admin'), schoolController.deleteSchool);
router.get('/:id/stats', authenticateToken, authorizeRole('super_admin'), schoolController.getSchoolStats);

module.exports = router;
