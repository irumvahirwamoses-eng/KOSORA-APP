const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.createStudent = async (req, res) => {
  const db = getDb();
  try {
    const { name, email, phone, classId, enrollmentDate, parentName, parentPhone } = req.body;

    const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const [classes] = await db.query('SELECT school_id FROM classes WHERE id = ?', [classId]);
    if (classes.length === 0) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (classes[0].school_id !== req.user.schoolId) {
      return res.status(403).json({ error: 'Cannot add student to another school class' });
    }

    const studentCode = `${req.user.schoolId}-${classId}-${Date.now().toString(36).toUpperCase()}`;

    const defaultPassword = await bcrypt.hash('student123', 10);

    const [userResult] = await db.query(
      'INSERT INTO users (school_id, name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.schoolId, name, email, defaultPassword, phone, 'student']
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

    let query = 'SELECT s.*, u.name, u.email, u.phone, u.is_active, c.name as class_name FROM students s JOIN users u ON s.user_id = u.id JOIN classes c ON s.class_id = c.id WHERE u.school_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM students s JOIN users u ON s.user_id = u.id WHERE u.school_id = ?';
    const params = [req.user.schoolId];

    if (classId) {
      query += ' AND s.class_id = ?';
      countQuery += ' AND s.class_id = ?';
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
      'WHERE s.id = ? AND u.school_id = ?',
      [req.params.id, req.user.schoolId]
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
    const [verify] = await db.query(
      'SELECT u.id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND u.school_id = ?',
      [req.params.id, req.user.schoolId]
    );
    if (verify.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const { classId, enrollmentDate, parentName, parentPhone } = req.body;

    if (classId) {
      const [classes] = await db.query('SELECT school_id FROM classes WHERE id = ?', [classId]);
      if (classes.length === 0 || classes[0].school_id !== req.user.schoolId) {
        return res.status(403).json({ error: 'Invalid class' });
      }
    }

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
    const [students] = await db.query(
      'SELECT s.user_id FROM students s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND u.school_id = ?',
      [req.params.id, req.user.schoolId]
    );
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
      'JOIN students st ON ea.student_id = st.id ' +
      'JOIN users u ON st.user_id = u.id ' +
      'WHERE ea.student_id = ? AND e.school_id = ? AND u.school_id = ? ' +
      'ORDER BY ea.created_at DESC',
      [req.params.id, req.user.schoolId, req.user.schoolId]
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
      'JOIN students st ON tr.student_id = st.id ' +
      'JOIN users u ON st.user_id = u.id ' +
      'JOIN classes c ON st.class_id = c.id ' +
      'WHERE tr.student_id = ? AND tr.term = ? AND tr.academic_year = ? AND tr.school_id = ? AND u.school_id = ?',
      [req.params.id, req.query.term || 'Term 1', req.query.academicYear || '2024-2025', req.user.schoolId, req.user.schoolId]
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
