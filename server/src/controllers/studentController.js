const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.createStudent = async (req, res) => {
  const db = getDb();
  try {
    const { schoolId, name, email, phone, classId, enrollmentDate, parentName, parentPhone } = req.body;

    const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const [classes] = await db.query('SELECT school_id FROM classes WHERE id = ?', [classId]);
    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const studentCode = `${classes[0].school_id}-${classId}-${Date.now().toString(36).toUpperCase()}`;

    const defaultPassword = await bcrypt.hash('student123', 10);

    const [userResult] = await db.query(
      'INSERT INTO users (school_id, name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [schoolId, name, email, defaultPassword, phone, 'student']
    );

    await db.query(
      'INSERT INTO students (user_id, student_code, class_id, enrollment_date, parent_name, parent_phone) VALUES (?, ?, ?, ?, ?, ?)',
      [userResult.insertId, studentCode, classId, enrollmentDate || new Date(), parentName, parentPhone]
    );

    res.status(201).json({
      message: 'Student created successfully',
      studentCode,
      defaultPassword: 'student123'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

exports.getStudents = async (req, res) => {
  const db = getDb();
  try {
    const { classId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT s.*, u.name, u.email, u.phone, u.is_active, c.name as class_name FROM students s JOIN users u ON s.user_id = u.id JOIN classes c ON s.class_id = c.id';
    let countQuery = 'SELECT COUNT(*) as total FROM students s JOIN users u ON s.user_id = u.id';
    const params = [];

    if (classId) {
      query += ' WHERE s.class_id = ?';
      countQuery += ' WHERE s.class_id = ?';
      params.push(classId);
    }

    query += ' ORDER BY u.name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [students] = await db.query(query, params);
    const [countResult] = await db.query(countQuery, params.slice(0, -2));

    res.json({
      students,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

exports.getStudent = async (req, res) => {
  const db = getDb();
  try {
    const [students] = await db.query(
      'SELECT s.*, u.name, u.email, u.phone, u.is_active, u.created_at, c.name as class_name, c.grade_level ' +
      'FROM students s JOIN users u ON s.user_id = u.id JOIN classes c ON s.class_id = c.id ' +
      'WHERE s.id = ?',
      [req.params.id]
    );

    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ student: students[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

exports.updateStudent = async (req, res) => {
  const db = getDb();
  try {
    const { classId, enrollmentDate, parentName, parentPhone } = req.body;

    await db.query(
      'UPDATE students SET class_id = COALESCE(?, class_id), enrollment_date = COALESCE(?, enrollment_date), parent_name = COALESCE(?, parent_name), parent_phone = COALESCE(?, parent_phone) WHERE id = ?',
      [classId, enrollmentDate, parentName, parentPhone, req.params.id]
    );

    res.json({ message: 'Student updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

exports.deleteStudent = async (req, res) => {
  const db = getDb();
  try {
    const [students] = await db.query('SELECT user_id FROM students WHERE id = ?', [req.params.id]);
    if (students.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await db.query('DELETE FROM students WHERE id = ?', [req.params.id]);
    await db.query('DELETE FROM users WHERE id = ?', [students[0].user_id]);

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

exports.getStudentResults = async (req, res) => {
  const db = getDb();
  try {
    const [results] = await db.query(
      'SELECT ea.*, e.title, e.exam_code, e.total_marks as exam_total_marks, s.name as subject_name ' +
      'FROM exam_answers ea ' +
      'JOIN exams e ON ea.exam_id = e.id ' +
      'JOIN subjects s ON e.subject_id = s.id ' +
      'WHERE ea.student_id = ? ' +
      'ORDER BY ea.created_at DESC',
      [req.params.id]
    );

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student results' });
  }
};

exports.getStudentReportCard = async (req, res) => {
  const db = getDb();
  try {
    const [reports] = await db.query(
      'SELECT tr.*, u.name as student_name, s.student_code, c.name as class_name ' +
      'FROM term_reports tr ' +
      'JOIN students s ON tr.student_id = s.id ' +
      'JOIN users u ON s.user_id = u.id ' +
      'JOIN classes c ON s.class_id = c.id ' +
      'WHERE tr.student_id = ? AND tr.term = ? AND tr.academic_year = ?',
      [req.params.id, req.query.term || 'Term 1', req.query.academicYear || '2024-2025']
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report card not found' });
    }

    res.json({ report: reports[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch report card' });
  }
};
