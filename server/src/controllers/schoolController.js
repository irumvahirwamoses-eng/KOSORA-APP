const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

exports.createSchool = async (req, res) => {
  const db = getDb();
  try {
    const { name, code, adminName, adminEmail, adminPassword, adminPhone } = req.body;

    if (!name || !code || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [existingSchool] = await db.query('SELECT id FROM schools WHERE code = ?', [code]);
    if (existingSchool.length > 0) {
      return res.status(409).json({ error: 'School code already exists' });
    }

    const [existingEmail] = await db.query('SELECT id FROM users WHERE email = ?', [adminEmail]);
    if (existingEmail.length > 0) {
      return res.status(409).json({ error: 'Admin email already exists' });
    }

    const [schoolResult] = await db.query(
      'INSERT INTO schools (name, code, subscription_status) VALUES (?, ?, ?)',
      [name, code, 'active']
    );

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const [adminResult] = await db.query(
      'INSERT INTO users (school_id, name, email, password_hash, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [schoolResult.insertId, adminName, adminEmail, passwordHash, adminPhone, 'admin', true]
    );

    res.status(201).json({
      message: 'School created successfully',
      school: { id: schoolResult.insertId, name, code },
      adminId: adminResult.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create school' });
  }
};

exports.getAllSchools = async (req, res) => {
  const db = getDb();
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [schools] = await db.query(
      'SELECT s.*, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT c.id) as class_count ' +
      'FROM schools s ' +
      'LEFT JOIN users u ON s.id = u.school_id ' +
      'LEFT JOIN classes c ON s.id = c.school_id ' +
      'GROUP BY s.id ' +
      'ORDER BY s.created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM schools');

    res.json({
      schools,
      pagination: {
        total: countResult[0].total,
        page,
        limit,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
};

exports.getSchool = async (req, res) => {
  const db = getDb();
  try {
    const [schools] = await db.query(
      'SELECT s.*, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT c.id) as class_count ' +
      'FROM schools s ' +
      'LEFT JOIN users u ON s.id = u.school_id ' +
      'LEFT JOIN classes c ON s.id = c.school_id ' +
      'WHERE s.id = ? GROUP BY s.id',
      [req.params.id]
    );

    if (schools.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ school: schools[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
};

exports.updateSchool = async (req, res) => {
  const db = getDb();
  try {
    const { name, code, subscriptionStatus } = req.body;

    await db.query(
      'UPDATE schools SET name = COALESCE(?, name), code = COALESCE(?, code), subscription_status = COALESCE(?, subscription_status) WHERE id = ?',
      [name, code, subscriptionStatus, req.params.id]
    );

    res.json({ message: 'School updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update school' });
  }
};

exports.deleteSchool = async (req, res) => {
  const db = getDb();
  try {
    await db.query('DELETE FROM schools WHERE id = ?', [req.params.id]);
    res.json({ message: 'School deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete school' });
  }
};

exports.getSchoolStats = async (req, res) => {
  const db = getDb();
  try {
    const schoolId = req.params.id;

    const [totalStudents] = await db.query(
      'SELECT COUNT(*) as count FROM students st JOIN users u ON st.user_id = u.id WHERE u.school_id = ?',
      [schoolId]
    );

    const [totalTeachers] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = ?',
      [schoolId, 'teacher']
    );

    const [totalExams] = await db.query(
      'SELECT COUNT(*) as count FROM exams WHERE school_id = ?',
      [schoolId]
    );

    const [totalMaterials] = await db.query(
      'SELECT COUNT(*) as count FROM materials WHERE school_id = ?',
      [schoolId]
    );

    res.json({
      stats: {
        totalStudents: totalStudents[0].count,
        totalTeachers: totalTeachers[0].count,
        totalExams: totalExams[0].count,
        totalMaterials: totalMaterials[0].count
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch school stats' });
  }
};
