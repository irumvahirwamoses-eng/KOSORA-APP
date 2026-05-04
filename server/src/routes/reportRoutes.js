const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/class-results', authenticateToken, reportController.getClassResults);
router.get('/student/:studentId/performance', authenticateToken, reportController.getStudentPerformance);
router.get('/subject-analytics', authenticateToken, reportController.getSubjectAnalytics);
router.get('/class-analytics', authenticateToken, reportController.getClassAnalytics);
router.post('/report-card', authenticateToken, authorizeRole('admin', 'teacher'), reportController.generateReportCard);
router.get('/report-card/:studentId/:term/:academicYear', authenticateToken, reportController.downloadReportCard);
router.get('/dashboard', authenticateToken, reportController.getDashboardStats);
router.get('/system-overview', authenticateToken, authorizeRole('super_admin'), reportController.getSystemOverview);

module.exports = router;
