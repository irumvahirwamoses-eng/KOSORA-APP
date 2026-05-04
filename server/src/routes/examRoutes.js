const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const pdfController = require('../controllers/pdfController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole('teacher'), examController.createExam);
router.get('/', authenticateToken, examController.getExams);
router.get('/:id', authenticateToken, examController.getExam);
router.put('/:id', authenticateToken, authorizeRole('teacher'), examController.updateExam);
router.delete('/:id', authenticateToken, authorizeRole('teacher'), examController.deleteExam);
router.put('/:id/finalize', authenticateToken, authorizeRole('teacher'), examController.finalizeExam);

router.post('/:examId/generate-questions', authenticateToken, authorizeRole('teacher'), examController.generateExamQuestions);
router.post('/:examId/questions', authenticateToken, authorizeRole('teacher'), examController.addQuestionsBatch);
router.post('/:examId/questions/single', authenticateToken, authorizeRole('teacher'), examController.addQuestion);
router.put('/:examId/questions/:questionId', authenticateToken, authorizeRole('teacher'), examController.updateQuestion);
router.delete('/:examId/questions/:questionId', authenticateToken, authorizeRole('teacher'), examController.deleteQuestion);

router.get('/:examId/pdf', authenticateToken, pdfController.previewExamPaper);
router.get('/:examId/pdf/download', authenticateToken, pdfController.downloadExamPaper);
router.get('/:examId/omr', authenticateToken, pdfController.previewOMRSheet);
router.get('/:examId/omr/download', authenticateToken, pdfController.downloadOMRSheet);

module.exports = router;
