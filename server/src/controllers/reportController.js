const { getDb } = require('../config/database');
const PDFDocument = require('pdfkit');

exports.getClassResults = async (req, res) => {
  const db = getDb();
  try {
    const { examId, classId } = req.query;

    let query = `
      SELECT ea.*, u.name as student_name, s.student_code, c.name as class_name
      FROM exam_answers ea
      JOIN students s ON ea.student_id = s.id
      JOIN users u ON s.user_id = u.id
      JOIN classes c ON s.class_id = c.id
      JOIN exams e ON ea.exam_id = e.id
      WHERE e.school_id = ?
    `;
    const params = [req.user.schoolId];

    if (examId) {
      query += ' AND ea.exam_id = ?';
      params.push(examId);
    }
    if (classId) {
      query += ' AND s.class_id = ?';
      params.push(classId);
    }

    query += ' ORDER BY u.name ASC';

    const [results] = await db.query(query, params);

    const stats = calculateClassStats(results);

    res.json({ results, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch class results' });
  }
};

exports.getStudentPerformance = async (req, res) => {
  const db = getDb();
  try {
    const studentId = req.params.studentId;

    const [studentInfo] = await db.query(
      'SELECT u.name, s.student_code, c.name as class_name, s.id as students_id ' +
      'FROM students s JOIN users u ON s.user_id = u.id JOIN classes c ON s.class_id = c.id ' +
      'WHERE s.user_id = ? AND u.school_id = ?',
      [studentId, req.user.schoolId]
    );

    if (studentInfo.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [results] = await db.query(
      'SELECT ea.*, e.title, e.exam_code, e.total_marks as exam_total, s.name as subject_name, e.term, e.academic_year ' +
      'FROM exam_answers ea ' +
      'JOIN exams e ON ea.exam_id = e.id ' +
      'JOIN subjects s ON e.subject_id = s.id ' +
      'WHERE ea.student_id = ? AND e.school_id = ? ' +
      'ORDER BY e.academic_year DESC, e.term DESC, e.created_at DESC',
      [studentInfo[0].students_id, req.user.schoolId]
    );

    const subjectAverages = {};
    results.forEach(r => {
      if (!subjectAverages[r.subject_name]) {
        subjectAverages[r.subject_name] = [];
      }
      subjectAverages[r.subject_name].push(r.percentage);
    });

    const subjectStats = {};
    Object.keys(subjectAverages).forEach(subject => {
      const scores = subjectAverages[subject];
      subjectStats[subject] = {
        average: scores.reduce((a, b) => a + b, 0) / scores.length,
        highest: Math.max(...scores),
        lowest: Math.min(...scores),
        examsTaken: scores.length
      };
    });

    res.json({
      student: studentInfo[0],
      results,
      subjectStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch student performance' });
  }
};

exports.getSubjectAnalytics = async (req, res) => {
  const db = getDb();
  try {
    const { subjectId, academicYear, term } = req.query;

    let query = `
      SELECT s.name as subject_name, COUNT(DISTINCT e.id) as exam_count,
             COUNT(DISTINCT ea.student_id) as student_count,
             AVG(ea.percentage) as average_percentage,
             MAX(ea.percentage) as highest_score,
             MIN(ea.percentage) as lowest_score
      FROM exams e
      JOIN exam_answers ea ON e.id = ea.exam_id
      JOIN subjects s ON e.subject_id = s.id
      WHERE e.school_id = ?
    `;
    const params = [req.user.schoolId];

    if (subjectId) {
      query += ' AND e.subject_id = ?';
      params.push(subjectId);
    }
    if (academicYear) {
      query += ' AND e.academic_year = ?';
      params.push(academicYear);
    }
    if (term) {
      query += ' AND e.term = ?';
      params.push(term);
    }

    query += ' GROUP BY s.id, s.name';

    const [analytics] = await db.query(query, params);

    res.json({ analytics });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subject analytics' });
  }
};

exports.getClassAnalytics = async (req, res) => {
  const db = getDb();
  try {
    const { classId, academicYear, term } = req.query;

    let query = `
      SELECT c.name as class_name, s.name as subject_name,
             COUNT(DISTINCT e.id) as exam_count,
             AVG(ea.percentage) as average_percentage,
             COUNT(CASE WHEN ea.percentage >= 50 THEN 1 END) as passed,
             COUNT(CASE WHEN ea.percentage < 50 THEN 1 END) as failed
      FROM classes c
      JOIN students st ON c.id = st.class_id
      JOIN exam_answers ea ON st.id = ea.student_id
      JOIN exams e ON ea.exam_id = e.id
      JOIN subjects s ON e.subject_id = s.id
      WHERE c.school_id = ?
    `;
    const params = [req.user.schoolId];

    if (classId) {
      query += ' AND c.id = ?';
      params.push(classId);
    }
    if (academicYear) {
      query += ' AND e.academic_year = ?';
      params.push(academicYear);
    }
    if (term) {
      query += ' AND e.term = ?';
      params.push(term);
    }

    query += ' GROUP BY c.id, s.id ORDER BY c.name, s.name';

    const [analytics] = await db.query(query, params);

    // Grade distribution
    const [gradeDist] = await db.query(`
      SELECT
        COUNT(CASE WHEN ea.percentage >= 90 THEN 1 END) as A,
        COUNT(CASE WHEN ea.percentage >= 80 AND ea.percentage < 90 THEN 1 END) as B_plus,
        COUNT(CASE WHEN ea.percentage >= 75 AND ea.percentage < 80 THEN 1 END) as B,
        COUNT(CASE WHEN ea.percentage >= 70 AND ea.percentage < 75 THEN 1 END) as C_plus,
        COUNT(CASE WHEN ea.percentage >= 65 AND ea.percentage < 70 THEN 1 END) as C,
        COUNT(CASE WHEN ea.percentage >= 60 AND ea.percentage < 65 THEN 1 END) as D_plus,
        COUNT(CASE WHEN ea.percentage >= 55 AND ea.percentage < 60 THEN 1 END) as D,
        COUNT(CASE WHEN ea.percentage >= 50 AND ea.percentage < 55 THEN 1 END) as E,
        COUNT(CASE WHEN ea.percentage < 50 THEN 1 END) as F
      FROM exam_answers ea
      JOIN exams e ON ea.exam_id = e.id
      WHERE e.school_id = ?
    `, [req.user.schoolId]);

    res.json({ analytics, gradeDistribution: gradeDist[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch class analytics' });
  }
};

exports.generateReportCard = async (req, res) => {
  const db = getDb();
  try {
    const { studentId, term, academicYear } = req.body;

    const [studentInfo] = await db.query(
      'SELECT u.name as student_name, s.student_code, c.name as class_name, c.grade_level, ' +
      'sc.name as school_name, s.parent_name, s.parent_phone ' +
      'FROM students s ' +
      'JOIN users u ON s.user_id = u.id ' +
      'JOIN classes c ON s.class_id = c.id ' +
      'JOIN schools sc ON c.school_id = sc.id ' +
      'WHERE s.id = ? AND c.school_id = ?',
      [studentId, req.user.schoolId]
    );

    if (studentInfo.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const [examResults] = await db.query(
      'SELECT e.subject_id, s.name as subject_name, AVG(ea.percentage) as average_percentage, ' +
      'MAX(ea.percentage) as highest, MIN(ea.percentage) as lowest, ' +
      'AVG(ea.score) as average_score, AVG(ea.total_marks) as total_marks ' +
      'FROM exam_answers ea ' +
      'JOIN exams e ON ea.exam_id = e.id ' +
      'JOIN subjects s ON e.subject_id = s.id ' +
      'WHERE ea.student_id = ? AND e.term = ? AND e.academic_year = ? ' +
      'GROUP BY e.subject_id, s.name',
      [studentId, term, academicYear]
    );

    const subjects = examResults.map(r => ({
      subject: r.subject_name,
      average: parseFloat(r.average_percentage.toFixed(1)),
      highest: parseFloat(r.highest),
      lowest: parseFloat(r.lowest),
      grade: calculateGrade(r.average_percentage)
    }));

    const overallPercentage = subjects.length > 0
      ? subjects.reduce((sum, s) => sum + s.average, 0) / subjects.length
      : 0;
    const overallGrade = calculateGrade(overallPercentage);

    await db.query(
      'INSERT INTO term_reports (school_id, student_id, term, academic_year, subjects, overall_grade, overall_percentage, generated_by) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE subjects = VALUES(subjects), overall_grade = VALUES(overall_grade), overall_percentage = VALUES(overall_percentage)',
      [req.user.schoolId, studentId, term, academicYear, JSON.stringify(subjects), overallGrade, overallPercentage.toFixed(1), req.user.id]
    );

    res.json({
      message: 'Report card generated',
      student: studentInfo[0],
      subjects,
      overallGrade,
      overallPercentage: overallPercentage.toFixed(1),
      term,
      academicYear
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate report card' });
  }
};

exports.downloadReportCard = async (req, res) => {
  const db = getDb();
  try {
    const { studentId, term, academicYear } = req.params;

    const [reports] = await db.query(
      'SELECT tr.*, u.name as student_name, s.student_code, c.name as class_name, c.grade_level, sc.name as school_name ' +
      'FROM term_reports tr ' +
      'JOIN students s ON tr.student_id = s.id ' +
      'JOIN users u ON s.user_id = u.id ' +
      'JOIN classes c ON s.class_id = c.id ' +
      'JOIN schools sc ON c.school_id = sc.id ' +
      'WHERE tr.student_id = ? AND tr.term = ? AND tr.academic_year = ? AND tr.school_id = ?',
      [studentId, term, academicYear, req.user.schoolId]
    );

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report card not found. Generate it first.' });
    }

    const report = reports[0];
    const subjects = typeof report.subjects === 'string' ? JSON.parse(report.subjects) : report.subjects;

    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => res.send(Buffer.concat(buffers)));

    doc.setHeader('Content-Type', 'application/pdf');
    doc.setHeader('Content-Disposition', `attachment; filename=report_card_${report.student_code}_${report.term}_${report.academic_year}.pdf`);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text(report.school_name, { align: 'center' });
    doc.fontSize(14).font('Helvetica').text('STUDENT REPORT CARD', { align: 'center' });
    doc.moveDown(0.5);

    // Student info
    doc.fontSize(11).font('Helvetica-Bold').text(`Student: ${report.student_name}`);
    doc.fontSize(11).text(`Student ID: ${report.student_code}`);
    doc.fontSize(11).text(`Class: ${report.class_name}`);
    doc.fontSize(11).text(`Term: ${report.term} | Academic Year: ${report.academic_year}`);
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const tableHeaders = ['Subject', 'Average %', 'Grade', 'Highest', 'Lowest'];
    const colWidths = [160, 80, 60, 70, 70];

    let x = 40;
    tableHeaders.forEach((header, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(header, x, tableTop, { width: colWidths[i] });
      x += colWidths[i];
    });

    doc.moveTo(40, tableTop + 15).lineTo(490, tableTop + 15).stroke();

    // Table rows
    let y = tableTop + 20;
    subjects.forEach((subject, index) => {
      x = 40;
      const rowData = [subject.subject, `${subject.average}%`, subject.grade, `${subject.highest}%`, `${subject.lowest}%`];
      rowData.forEach((cell, i) => {
        doc.fontSize(9).font('Helvetica').text(cell, x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
      y += 18;
    });

    // Overall
    y += 10;
    doc.moveTo(40, y).lineTo(490, y).stroke();
    y += 10;
    doc.fontSize(12).font('Helvetica-Bold').text(`Overall: ${report.overall_percentage}% - Grade: ${report.overall_grade}`, 40, y);

    doc.moveDown(2);
    doc.fontSize(8).text(`Generated by Kosora App | ${new Date().toLocaleDateString()}`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download report card' });
  }
};

exports.getDashboardStats = async (req, res) => {
  const db = getDb();
  try {
    const schoolId = req.user.schoolId;

    const [totalStudents] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = ?', [schoolId, 'student']
    );
    const [totalTeachers] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE school_id = ? AND role = ?', [schoolId, 'teacher']
    );
    const [totalExams] = await db.query(
      'SELECT COUNT(*) as count FROM exams WHERE school_id = ?', [schoolId]
    );
    const [totalMaterials] = await db.query(
      'SELECT COUNT(*) as count FROM materials WHERE school_id = ?', [schoolId]
    );
    const [recentExams] = await db.query(
      'SELECT e.title, e.exam_code, e.status, e.created_at, s.name as subject_name, c.name as class_name ' +
      'FROM exams e JOIN subjects s ON e.subject_id = s.id JOIN classes c ON e.class_id = c.id ' +
      'WHERE e.school_id = ? ORDER BY e.created_at DESC LIMIT 5', [schoolId]
    );

    res.json({
      stats: {
        totalStudents: totalStudents[0].count,
        totalTeachers: totalTeachers[0].count,
        totalExams: totalExams[0].count,
        totalMaterials: totalMaterials[0].count
      },
      recentExams
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

exports.getSystemOverview = async (req, res) => {
  const db = getDb();
  try {
    const [schoolCount] = await db.query('SELECT COUNT(*) as count FROM schools');
    
    const [usersByRole] = await db.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    const [totalExams] = await db.query('SELECT COUNT(*) as count FROM exams');
    const [totalMaterials] = await db.query('SELECT COUNT(*) as count FROM materials');
    const [totalStudents] = await db.query('SELECT COUNT(*) as count FROM students');

    const [recentActivity] = await db.query(
      'SELECT "exam" as type, e.title as name, e.created_at, sc.name as school_name FROM exams e JOIN schools sc ON e.school_id = sc.id ORDER BY e.created_at DESC LIMIT 10'
    );

    const [topSchools] = await db.query(
      'SELECT s.name, s.code, COUNT(DISTINCT u.id) as user_count, COUNT(DISTINCT e.id) as exam_count ' +
      'FROM schools s ' +
      'LEFT JOIN users u ON s.id = u.school_id ' +
      'LEFT JOIN exams e ON s.id = e.school_id ' +
      'GROUP BY s.id ORDER BY user_count DESC LIMIT 10'
    );

    const roleMap = {};
    usersByRole.forEach(r => { roleMap[r.role] = r.count; });

    res.json({
      stats: {
        totalSchools: schoolCount[0].count,
        totalUsers: roleMap.admin + roleMap.teacher + roleMap.student || 0,
        totalExams: totalExams[0].count,
        totalMaterials: totalMaterials[0].count,
        totalStudents: totalStudents[0].count,
        roles: roleMap
      },
      recentActivity,
      topSchools
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch system overview' });
  }
};

function calculateClassStats(results) {
  if (results.length === 0) return {};

  const scores = results.map(r => parseFloat(r.percentage) || 0);
  return {
    totalStudents: results.length,
    average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
    highest: Math.max(...scores).toFixed(1),
    lowest: Math.min(...scores).toFixed(1),
    passed: scores.filter(s => s >= 50).length,
    failed: scores.filter(s => s < 50).length
  };
}

function calculateGrade(percentage) {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B+';
  if (percentage >= 75) return 'B';
  if (percentage >= 70) return 'C+';
  if (percentage >= 65) return 'C';
  if (percentage >= 60) return 'D+';
  if (percentage >= 55) return 'D';
  if (percentage >= 50) return 'E';
  return 'F';
}
