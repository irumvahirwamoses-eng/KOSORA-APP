const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/classes', authenticateToken, authorizeRole('admin', 'teacher'), classController.createClass);
router.post('/users', authenticateToken, authorizeRole('admin'), classController.createUser);
router.get('/classes', authenticateToken, classController.getClasses);
router.put('/classes/:id', authenticateToken, authorizeRole('admin'), classController.updateClass);
router.delete('/classes/:id', authenticateToken, authorizeRole('admin'), classController.deleteClass);

router.post('/subjects', authenticateToken, authorizeRole('admin', 'teacher'), classController.createSubject);
router.get('/subjects', authenticateToken, classController.getSubjects);
router.post('/class-subjects', authenticateToken, authorizeRole('admin'), classController.assignSubjectToClass);

router.get('/users', authenticateToken, authorizeRole('admin'), classController.getUserManagement);
router.put('/users/:id/status', authenticateToken, authorizeRole('admin'), classController.updateUserStatus);

module.exports = router;
