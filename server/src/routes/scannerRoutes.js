const express = require('express');
const router = express.Router();
const scannerController = require('../controllers/scannerController');
const upload = require('../middleware/upload');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/:examId/upload', authenticateToken, authorizeRole('teacher'), upload.single('scan'), scannerController.uploadScan);
router.post('/:examId/process', authenticateToken, authorizeRole('teacher'), upload.single('scan'), scannerController.processScanDirect);
router.post('/scan/:scanId/process', authenticateToken, authorizeRole('teacher'), scannerController.processScan);
router.get('/:examId/scans', authenticateToken, scannerController.getScanResults);

module.exports = router;
