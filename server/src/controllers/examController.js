const { getDb } = require('../config/database');
const { generateQuestions } = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

exports.createExam = async (req, res) => {
  const db = getDb();
  try {
    const { title, subjectId, classId, instructions, durationMinutes, totalMarks, passingMarks, term, academicYear, assessmentType } = req.body;
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    const examCode = `EXAM-${schoolId}-${Date.now().toString(36).toUpperCase()}`;

    const [result] = await db.query(
      'INSERT INTO exams (school_id, subject_id, class_id, teacher_id, title, exam_code, instructions, duration_minutes, total_marks, passing_marks, term, academic_year, assessment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [schoolId, subjectId, classId, teacherId, title, examCode, instructions, durationMinutes, totalMarks, passingMarks, term, academicYear, assessmentType || 'exam']
    );

    res.status(201).json({
      message: 'Exam created successfully',
      exam: { id: result.insertId, title, examCode }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

exports.generateExamQuestions = async (req, res) => {
  const db = getDb();
  try {
    const examId = req.params.examId;
    const { materialIds, questionCount = 10, questionTypes = ['multiple_choice'], difficulty = 'medium' } = req.body;

    if (!materialIds || materialIds.length === 0) {
      return res.status(400).json({ error: 'At least one material is required for AI generation' });
    }

    const materials = await db.query(
      'SELECT id, title, text_content FROM materials WHERE id IN (?) AND school_id = ?',
      [materialIds, req.user.schoolId]
    );

    if (materials[0].length === 0) {
      return res.status(404).json({ error: 'No valid materials found' });
    }

    const content = materials[0].map(m => `--- ${m.title} ---\n${m.text_content}`).join('\n\n');

    const generatedQuestions = await generateQuestions({
      content,
      questionCount: parseInt(questionCount),
      questionTypes,
      difficulty,
      subject: req.body.subject
    });

    res.json({ questions: generatedQuestions });
  } catch (err) {
    console.error('Exam generation error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate questions' });
  }
};

exports.addQuestion = async (req, res) => {
  const db = getDb();
  try {
    const examId = req.params.examId;
    const { questionNumber, type, questionText, options, correctAnswer, marks, topic, difficulty } = req.body;

    const [examCheck] = await db.query('SELECT id FROM exams WHERE id = ? AND school_id = ?', [examId, req.user.schoolId]);
    if (examCheck.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const [maxNum] = await db.query(
      'SELECT MAX(question_number) as maxNum FROM questions WHERE exam_id = ?',
      [examId]
    );

    const qNum = questionNumber || (maxNum[0].maxNum || 0) + 1;

    const [result] = await db.query(
      'INSERT INTO questions (exam_id, question_number, type, question_text, options, correct_answer, marks, topic, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [examId, qNum, type, questionText, JSON.stringify(options || []), correctAnswer, marks || 1, topic, difficulty || 'medium']
    );

    await db.query(
      'UPDATE exams SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE exam_id = ?) WHERE id = ?',
      [examId, examId]
    );

    res.status(201).json({ message: 'Question added', question: { id: result.insertId, questionNumber: qNum } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add question' });
  }
};

exports.addQuestionsBatch = async (req, res) => {
  const db = getDb();
  try {
    const examId = req.params.examId;
    const { questions } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array is required' });
    }

    const [maxNum] = await db.query(
      'SELECT MAX(question_number) as maxNum FROM questions WHERE exam_id = ?',
      [examId]
    );

    let qNum = maxNum[0].maxNum || 0;
    const inserted = [];

    for (const q of questions) {
      qNum++;
      const [result] = await db.query(
        'INSERT INTO questions (exam_id, question_number, type, question_text, options, correct_answer, marks, topic, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [examId, qNum, q.type, q.questionText, JSON.stringify(q.options || []), q.correctAnswer, q.marks || 1, q.topic, q.difficulty || 'medium']
      );
      inserted.push({ id: result.insertId, questionNumber: qNum });
    }

    await db.query(
      'UPDATE exams SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE exam_id = ?) WHERE id = ?',
      [examId, examId]
    );

    res.status(201).json({ message: `${inserted.length} questions added`, questions: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add questions' });
  }
};

exports.getExams = async (req, res) => {
  const db = getDb();
  try {
    const { classId, subjectId, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const schoolId = req.user.schoolId;

    let query = 'SELECT e.*, u.name as teacher_name, s.name as subject_name, c.name as class_name, (SELECT COUNT(*) FROM questions WHERE exam_id = e.id) as question_count FROM exams e JOIN users u ON e.teacher_id = u.id JOIN subjects s ON e.subject_id = s.id JOIN classes c ON e.class_id = c.id WHERE e.school_id = ?';
    const params = [schoolId];

    if (req.user.role === 'teacher') {
      query += ' AND e.teacher_id = ?';
      params.push(req.user.id);
    }

    if (classId) {
      query += ' AND e.class_id = ?';
      params.push(classId);
    }
    if (subjectId) {
      query += ' AND e.subject_id = ?';
      params.push(subjectId);
    }
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    query += ' ORDER BY e.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [exams] = await db.query(query, params);

    res.json({ exams });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

exports.getExam = async (req, res) => {
  const db = getDb();
  try {
    const [exams] = await db.query(
      'SELECT e.*, u.name as teacher_name, s.name as subject_name, c.name as class_name FROM exams e JOIN users u ON e.teacher_id = u.id JOIN subjects s ON e.subject_id = s.id JOIN classes c ON e.class_id = c.id WHERE e.id = ? AND e.school_id = ?',
      [req.params.id, req.user.schoolId]
    );

    if (exams.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    const [questions] = await db.query(
      'SELECT * FROM questions WHERE exam_id = ? ORDER BY question_number ASC',
      [req.params.id]
    );

    res.json({ exam: exams[0], questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch exam' });
  }
};

exports.updateExam = async (req, res) => {
  const db = getDb();
  try {
    const { title, instructions, durationMinutes, totalMarks, passingMarks, term, academicYear, status, assessmentType } = req.body;

    await db.query(
      'UPDATE exams SET title = COALESCE(?, title), instructions = COALESCE(?, instructions), duration_minutes = COALESCE(?, duration_minutes), total_marks = COALESCE(?, total_marks), passing_marks = COALESCE(?, passing_marks), term = COALESCE(?, term), academic_year = COALESCE(?, academic_year), status = COALESCE(?, status), assessment_type = COALESCE(?, assessment_type) WHERE id = ? AND school_id = ?',
      [title, instructions, durationMinutes, totalMarks, passingMarks, term, academicYear, status, assessmentType, req.params.id, req.user.schoolId]
    );

    res.json({ message: 'Exam updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update exam' });
  }
};

exports.updateQuestion = async (req, res) => {
  const db = getDb();
  try {
    const { questionText, options, correctAnswer, marks, topic, difficulty } = req.body;

    const [check] = await db.query(
      'SELECT q.id FROM questions q JOIN exams e ON q.exam_id = e.id WHERE q.id = ? AND e.school_id = ?',
      [req.params.questionId, req.user.schoolId]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await db.query(
      'UPDATE questions SET question_text = COALESCE(?, question_text), options = COALESCE(?, options), correct_answer = COALESCE(?, correct_answer), marks = COALESCE(?, marks), topic = COALESCE(?, topic), difficulty = COALESCE(?, difficulty) WHERE id = ?',
      [questionText, options ? JSON.stringify(options) : null, correctAnswer, marks, topic, difficulty, req.params.questionId]
    );

    await db.query(
      'UPDATE exams SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE exam_id = (SELECT exam_id FROM questions WHERE id = ?)) WHERE id = (SELECT exam_id FROM questions WHERE id = ?)',
      [req.params.questionId, req.params.questionId]
    );

    res.json({ message: 'Question updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

exports.deleteQuestion = async (req, res) => {
  const db = getDb();
  try {
    const [check] = await db.query(
      'SELECT q.exam_id FROM questions q JOIN exams e ON q.exam_id = e.id WHERE q.id = ? AND e.school_id = ?',
      [req.params.questionId, req.user.schoolId]
    );

    if (check.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await db.query('DELETE FROM questions WHERE id = ?', [req.params.questionId]);

    await db.query(
      'UPDATE exams SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE exam_id = ?) WHERE id = ?',
      [check[0].exam_id, check[0].exam_id]
    );

    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

exports.deleteExam = async (req, res) => {
  const db = getDb();
  try {
    await db.query('DELETE FROM exams WHERE id = ? AND school_id = ?', [req.params.id, req.user.schoolId]);
    res.json({ message: 'Exam deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};

exports.finalizeExam = async (req, res) => {
  const db = getDb();
  try {
    const [questions] = await db.query(
      'SELECT id FROM questions WHERE exam_id = ?',
      [req.params.id]
    );

    if (questions.length === 0) {
      return res.status(400).json({ error: 'Exam must have at least one question to finalize' });
    }

    await db.query(
      'UPDATE exams SET status = ? WHERE id = ? AND school_id = ?',
      ['finalized', req.params.id, req.user.schoolId]
    );

    res.json({ message: 'Exam finalized successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to finalize exam' });
  }
};
