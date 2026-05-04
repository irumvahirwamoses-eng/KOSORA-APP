const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const upload = require('../middleware/upload');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.post('/', authenticateToken, authorizeRole('teacher'), upload.single('file'), materialController.uploadMaterial);
router.get('/', authenticateToken, materialController.getMaterials);
router.get('/:id', authenticateToken, materialController.getMaterial);
router.get('/:id/content', authenticateToken, materialController.getMaterialContent);
router.put('/:id', authenticateToken, authorizeRole('teacher'), materialController.updateMaterial);
router.delete('/:id', authenticateToken, authorizeRole('teacher'), materialController.deleteMaterial);

module.exports = router;
