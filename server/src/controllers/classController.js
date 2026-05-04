const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.createUser = async (req, res) => {
  const db = getDb();
  try {
    const { name, email, password, phone, role } = req.body;

    if (!['admin', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Use admin or teacher' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (school_id, name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.schoolId, name, email, passwordHash, phone || null, role]
    );

    res.status(201).json({
      message: `${role === 'teacher' ? 'Teacher' : 'Admin'} created successfully`,
      user: { id: result.insertId, name, email, role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.createClass = async (req, res) => {
  const db = getDb();
  try {
    const { name, gradeLevel, teacherId, academicYear } = req.body;

    const [result] = await db.query(
      'INSERT INTO classes (school_id, name, grade_level, teacher_id, academic_year) VALUES (?, ?, ?, ?, ?)',
      [req.user.schoolId, name, gradeLevel, teacherId || null, academicYear || '2024-2025']
    );

    res.status(201).json({ message: 'Class created', classId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create class' });
  }
};

exports.getClasses = async (req, res) => {
  const db = getDb();
  try {
    const [classes] = await db.query(
      'SELECT c.*, u.name as teacher_name FROM classes c LEFT JOIN users u ON c.teacher_id = u.id WHERE c.school_id = ? ORDER BY c.grade_level ASC',
      [req.user.schoolId]
    );

    res.json({ classes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
};

exports.updateClass = async (req, res) => {
  const db = getDb();
  try {
    const { name, gradeLevel, teacherId, academicYear } = req.body;

    await db.query(
      'UPDATE classes SET name = COALESCE(?, name), grade_level = COALESCE(?, grade_level), teacher_id = COALESCE(?, teacher_id), academic_year = COALESCE(?, academic_year) WHERE id = ? AND school_id = ?',
      [name, gradeLevel, teacherId, academicYear, req.params.id, req.user.schoolId]
    );

    res.json({ message: 'Class updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update class' });
  }
};

exports.deleteClass = async (req, res) => {
  const db = getDb();
  try {
    await db.query('DELETE FROM classes WHERE id = ? AND school_id = ?', [req.params.id, req.user.schoolId]);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete class' });
  }
};

exports.createSubject = async (req, res) => {
  const db = getDb();
  try {
    const { name, code } = req.body;

    const [result] = await db.query(
      'INSERT INTO subjects (school_id, name, code) VALUES (?, ?, ?)',
      [req.user.schoolId, name, code]
    );

    res.status(201).json({ message: 'Subject created', subjectId: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Subject code already exists' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

exports.getSubjects = async (req, res) => {
  const db = getDb();
  try {
    const [subjects] = await db.query(
      'SELECT * FROM subjects WHERE school_id = ? ORDER BY name ASC',
      [req.user.schoolId]
    );

    res.json({ subjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

exports.assignSubjectToClass = async (req, res) => {
  const db = getDb();
  try {
    const { classId, subjectId, teacherId } = req.body;

    await db.query(
      'INSERT INTO class_subjects (class_id, subject_id, teacher_id) VALUES (?, ?, ?)',
      [classId, subjectId, teacherId || null]
    );

    res.json({ message: 'Subject assigned to class' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Subject already assigned to this class' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to assign subject' });
  }
};

exports.getUserManagement = async (req, res) => {
  const db = getDb();
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE school_id = ?';
    const params = [req.user.schoolId];

    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.query(query, params);
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM users WHERE school_id = ?',
      [req.user.schoolId]
    );

    res.json({
      users,
      pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.updateUserStatus = async (req, res) => {
  const db = getDb();
  try {
    const { isActive } = req.body;

    await db.query(
      'UPDATE users SET is_active = ? WHERE id = ? AND school_id = ? AND role != ?',
      [isActive, req.params.id, req.user.schoolId, 'admin']
    );

    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};
