const { generateExamPDF, generateOMRSheet } = require('../services/pdfService');

exports.downloadExamPaper = async (req, res) => {
  try {
    const pdfBuffer = await generateExamPDF(req.params.examId, req.user.schoolId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=exam_paper_${req.params.examId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.downloadOMRSheet = async (req, res) => {
  try {
    const pdfBuffer = await generateOMRSheet(req.params.examId, req.user.schoolId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=omr_sheet_${req.params.examId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.previewExamPaper = async (req, res) => {
  try {
    const pdfBuffer = await generateExamPDF(req.params.examId, req.user.schoolId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=exam_paper_${req.params.examId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.previewOMRSheet = async (req, res) => {
  try {
    const pdfBuffer = await generateOMRSheet(req.params.examId, req.user.schoolId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=omr_sheet_${req.params.examId}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
