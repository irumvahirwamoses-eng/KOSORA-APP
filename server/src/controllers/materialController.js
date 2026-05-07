const { getDb } = require('../config/database');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs').promises;

const extractTextFromPdf = async (filePath) => {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

const extractTextFromDocx = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const extractTextFromTxt = async (filePath) => {
  return await fs.readFile(filePath, 'utf-8');
};

exports.uploadMaterial = async (req, res) => {
  const db = getDb();
  try {
    const { subjectId, classId, title, description, topic } = req.body;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const file = req.file;
    let fileType, textContent;

    if (file.mimetype === 'application/pdf') {
      fileType = 'pdf';
      textContent = await extractTextFromPdf(file.path);
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      fileType = 'docx';
      textContent = await extractTextFromDocx(file.path);
    } else if (file.mimetype === 'text/plain') {
      fileType = 'text';
      textContent = await extractTextFromTxt(file.path);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const [result] = await db.query(
      'INSERT INTO materials (school_id, teacher_id, subject_id, class_id, title, description, file_path, file_type, file_size, text_content, topic) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [schoolId, teacherId, subjectId, classId || null, title, description, file.path, fileType, file.size, textContent, topic || null]
    );

    res.status(201).json({
      message: 'Material uploaded successfully',
      material: { id: result.insertId, title, fileType }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload material' });
  }
};

exports.getMaterials = async (req, res) => {
  const db = getDb();
  try {
    const { subjectId, classId, topic, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const schoolId = req.user.schoolId;

    let query = 'SELECT m.*, u.name as teacher_name, s.name as subject_name FROM materials m JOIN users u ON m.teacher_id = u.id JOIN subjects s ON m.subject_id = s.id WHERE m.school_id = ?';
    const params = [schoolId];

    if (req.user.role === 'teacher') {
      query += ' AND m.teacher_id = ?';
      params.push(req.user.id);
    }

    if (subjectId) {
      query += ' AND m.subject_id = ?';
      params.push(subjectId);
    }
    if (classId) {
      query += ' AND m.class_id = ?';
      params.push(classId);
    }
    if (topic) {
      query += ' AND m.topic = ?';
      params.push(topic);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [materials] = await db.query(query, params);

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM materials WHERE school_id = ?',
      [schoolId]
    );

    res.json({
      materials,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
};

exports.getMaterial = async (req, res) => {
  const db = getDb();
  try {
    const [materials] = await db.query(
      'SELECT m.*, u.name as teacher_name, s.name as subject_name FROM materials m JOIN users u ON m.teacher_id = u.id JOIN subjects s ON m.subject_id = s.id WHERE m.id = ? AND m.school_id = ?',
      [req.params.id, req.user.schoolId]
    );

    if (materials.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    const material = materials[0];
    delete material.text_content;

    res.json({ material });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch material' });
  }
};

exports.getMaterialContent = async (req, res) => {
  const db = getDb();
  try {
    const [materials] = await db.query(
      'SELECT id, title, text_content FROM materials WHERE id = ? AND school_id = ?',
      [req.params.id, req.user.schoolId]
    );

    if (materials.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ content: materials[0].text_content, title: materials[0].title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch material content' });
  }
};

exports.updateMaterial = async (req, res) => {
  const db = getDb();
  try {
    const { title, description, topic, subjectId, classId } = req.body;

    await db.query(
      'UPDATE materials SET title = COALESCE(?, title), description = COALESCE(?, description), topic = COALESCE(?, topic), subject_id = COALESCE(?, subject_id), class_id = COALESCE(?, class_id) WHERE id = ? AND school_id = ?',
      [title, description, topic, subjectId, classId, req.params.id, req.user.schoolId]
    );

    res.json({ message: 'Material updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update material' });
  }
};

exports.deleteMaterial = async (req, res) => {
  const db = getDb();
  try {
    const [materials] = await db.query(
      'SELECT file_path FROM materials WHERE id = ? AND school_id = ?',
      [req.params.id, req.user.schoolId]
    );

    if (materials.length === 0) {
      return res.status(404).json({ error: 'Material not found' });
    }

    try {
      await fs.unlink(materials[0].file_path);
    } catch (err) {
      console.warn('Could not delete file:', err.message);
    }

    await db.query('DELETE FROM materials WHERE id = ?', [req.params.id]);
    res.json({ message: 'Material deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete material' });
  }
};
