const { getDb } = require('../config/database');
const axios = require('axios');
const path = require('path');

const SCANNER_URL = process.env.PYTHON_SCANNER_URL || 'http://localhost:5001';

exports.uploadScan = async (req, res) => {
  const db = getDb();
  try {
    const examId = req.params.examId;
    const studentId = req.body.studentId;

    if (!req.file) {
      return res.status(400).json({ error: 'Scan image is required' });
    }

    const [exam] = await db.query(
      'SELECT id, status FROM exams WHERE id = ? AND school_id = ?',
      [examId, req.user.schoolId]
    );

    if (exam.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const [scanResult] = await db.query(
      'INSERT INTO omr_scans (exam_id, student_id, image_path, status) VALUES (?, ?, ?, ?)',
      [examId, studentId || null, req.file.path, 'pending']
    );

    res.status(201).json({
      message: 'Scan uploaded successfully',
      scanId: scanResult.insertId,
      status: 'pending'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload scan' });
  }
};

exports.processScan = async (req, res) => {
  const db = getDb();
  try {
    const scanId = req.params.scanId;

    const [scans] = await db.query(
      'SELECT os.*, e.id as exam_id FROM omr_scans os JOIN exams e ON os.exam_id = e.id WHERE os.id = ? AND e.school_id = ?',
      [scanId, req.user.schoolId]
    );

    if (scans.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }

    const scan = scans[0];

    // Get answer key
    const [questions] = await db.query(
      'SELECT question_number, correct_answer FROM questions WHERE exam_id = ? AND type = "multiple_choice" ORDER BY question_number ASC',
      [scan.exam_id]
    );

    const answerKey = {};
    questions.forEach(q => {
      answerKey[q.question_number] = q.correct_answer;
    });

    try {
      // Call Python scanner service
      const formData = new FormData();
      formData.append('image', {
        uri: path.resolve(scan.image_path),
        name: path.basename(scan.image_path),
        type: 'image/jpeg'
      });
      formData.append('answer_key', JSON.stringify(answerKey));

      const scannerResponse = await axios.post(`${SCANNER_URL}/process-omr`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000
      });

      const { detectedAnswers, score, totalMarks, studentId } = scannerResponse.data;

      const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
      const grade = calculateGrade(percentage);

      await db.query(
        'UPDATE omr_scans SET detected_answers = ?, score = ?, total_marks = ?, student_id = COALESCE(?, student_id), status = ? WHERE id = ?',
        [JSON.stringify(detectedAnswers), score, totalMarks, studentId || scan.student_id, 'processed', scanId]
      );

      // Create or update exam answer
      const [existingAnswers] = await db.query(
        'SELECT id FROM exam_answers WHERE exam_id = ? AND student_id = ?',
        [scan.exam_id, studentId || scan.student_id]
      );

      if (existingAnswers.length > 0) {
        await db.query(
          'UPDATE exam_answers SET answers = ?, score = ?, total_marks = ?, percentage = ?, grade = ?, graded_at = NOW() WHERE exam_id = ? AND student_id = ?',
          [JSON.stringify(detectedAnswers), score, totalMarks, percentage, grade, scan.exam_id, studentId || scan.student_id]
        );
      } else {
        await db.query(
          'INSERT INTO exam_answers (exam_id, student_id, answers, score, total_marks, percentage, grade, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
          [scan.exam_id, studentId || scan.student_id, JSON.stringify(detectedAnswers), score, totalMarks, percentage, grade]
        );
      }

      res.json({
        message: 'Scan processed successfully',
        detectedAnswers,
        score,
        totalMarks,
        percentage,
        grade
      });
    } catch (scannerErr) {
      console.error('Scanner service error:', scannerErr.message);

      await db.query(
        'UPDATE omr_scans SET status = ?, error_message = ? WHERE id = ?',
        ['error', scannerErr.message, scanId]
      );

      res.status(502).json({ error: 'Scanner service unavailable. Please try again later.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process scan' });
  }
};

exports.processScanDirect = async (req, res) => {
  const db = getDb();
  try {
    const examId = req.params.examId;
    const studentId = req.body.studentId;

    if (!req.file) {
      return res.status(400).json({ error: 'Scan image is required' });
    }

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const [questions] = await db.query(
      'SELECT question_number, correct_answer FROM questions WHERE exam_id = ? AND type = "multiple_choice" ORDER BY question_number ASC',
      [examId]
    );

    const answerKey = {};
    questions.forEach(q => {
      answerKey[q.question_number] = q.correct_answer;
    });

    // Save scan record
    const [scanResult] = await db.query(
      'INSERT INTO omr_scans (exam_id, student_id, image_path, status) VALUES (?, ?, ?, ?)',
      [examId, studentId, req.file.path, 'pending']
    );

    // Call scanner
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('image', require('fs').createReadStream(req.file.path), { filename: req.file.filename });
    formData.append('answer_key', JSON.stringify(answerKey));

    const scannerResponse = await axios.post(`${SCANNER_URL}/process-omr`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000
    });

    const { detectedAnswers, score, totalMarks } = scannerResponse.data;
    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const grade = calculateGrade(percentage);

    await db.query(
      'UPDATE omr_scans SET detected_answers = ?, score = ?, total_marks = ?, status = ? WHERE id = ?',
      [JSON.stringify(detectedAnswers), score, totalMarks, 'processed', scanResult.insertId]
    );

    await db.query(
      'INSERT IGNORE INTO exam_answers (exam_id, student_id, answers, score, total_marks, percentage, grade, graded_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [examId, studentId, JSON.stringify(detectedAnswers), score, totalMarks, percentage, grade]
    );

    // Update exam status if needed
    await db.query(
      'UPDATE exams SET status = ? WHERE id = ? AND status != ?',
      ['completed', examId, 'completed']
    );

    res.json({
      message: 'Scan processed successfully',
      score,
      totalMarks,
      percentage,
      grade,
      correctCount: Object.keys(detectedAnswers).filter(k => detectedAnswers[k] === answerKey[parseInt(k)]).length,
      totalQuestions: questions.length
    });
  } catch (err) {
    console.error(err);
    if (err.code === 'ECONNREFUSED') {
      return res.status(502).json({ error: 'Scanner service is not running. Start the Python scanner service.' });
    }
    res.status(500).json({ error: err.message || 'Failed to process scan' });
  }
};

exports.getScanResults = async (req, res) => {
  const db = getDb();
  try {
    let whereClause = 'WHERE os.exam_id = ? AND e.school_id = ?';
    const params = [req.params.examId, req.user.schoolId];

    if (req.user.role === 'teacher') {
      whereClause += ' AND e.teacher_id = ?';
      params.push(req.user.id);
    }

    const [scans] = await db.query(
      'SELECT os.*, u.name as student_name, e.title as exam_title ' +
      'FROM omr_scans os ' +
      'LEFT JOIN students st ON os.student_id = st.id ' +
      'LEFT JOIN users u ON st.user_id = u.id ' +
      'JOIN exams e ON os.exam_id = e.id ' +
      whereClause +
      ' ORDER BY os.created_at DESC',
      params
    );

    res.json({ scans });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch scan results' });
  }
};

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

// FormData polyfill for Node.js
if (typeof FormData === 'undefined') {
  global.FormData = require('form-data');
}
