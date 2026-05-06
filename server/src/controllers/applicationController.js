const { getDb } = require('../config/database');

exports.submitApplication = async (req, res) => {
  const db = getDb();
  try {
    const { schoolName, contactPerson, email, phone, location, schoolType, studentCount, message } = req.body;

    if (!schoolName || !contactPerson || !email || !phone) {
      return res.status(400).json({ error: 'School name, contact person, email, and phone are required' });
    }

    const [existing] = await db.query('SELECT id FROM school_applications WHERE email = ? AND status = ?', [email, 'pending']);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An application with this email is already pending' });
    }

    const [result] = await db.query(
      'INSERT INTO school_applications (school_name, contact_person, email, phone, location, school_type, student_count, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [schoolName, contactPerson, email, phone, location || null, schoolType || 'both', studentCount || null, message || null]
    );

    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: result.insertId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

exports.getAllApplications = async (req, res) => {
  const db = getDb();
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM school_applications';
    let params = [];

    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const [applications] = await db.query(query, params);

    res.json({ applications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
};

exports.getApplication = async (req, res) => {
  const db = getDb();
  try {
    const [applications] = await db.query('SELECT * FROM school_applications WHERE id = ?', [req.params.id]);

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ application: applications[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  const db = getDb();
  try {
    const { status, notes } = req.body;

    if (!['pending', 'approved', 'rejected', 'registered'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [result] = await db.query(
      'UPDATE school_applications SET status = ?, notes = COALESCE(?, notes) WHERE id = ?',
      [status, notes, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update application status' });
  }
};

exports.deleteApplication = async (req, res) => {
  const db = getDb();
  try {
    const [result] = await db.query('DELETE FROM school_applications WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete application' });
  }
};
