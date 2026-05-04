const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole('admin', 'teacher'), studentController.createStudent);
router.get('/', authenticateToken, studentController.getStudents);
router.get('/:id', authenticateToken, studentController.getStudent);
router.put('/:id', authenticateToken, authorizeRole('admin'), studentController.updateStudent);
router.delete('/:id', authenticateToken, authorizeRole('admin'), studentController.deleteStudent);
router.get('/:id/results', authenticateToken, studentController.getStudentResults);
router.get('/:id/report-card', authenticateToken, studentController.getStudentReportCard);

module.exports = router;
