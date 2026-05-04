import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi';

const ExamEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ questionText: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', marks: 1, topic: '', difficulty: 'medium' });

  useEffect(() => { fetch(); }, [id]);

  const fetch = async () => {
    try {
      const res = await api.get(`/api/exams/${id}`);
      setExam(res.data.exam);
      setQuestions(res.data.questions || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/exams/${id}/questions/single`, { ...form, options: form.type === 'multiple_choice' ? form.options : [] });
      toast.success('Added');
      setShowModal(false);
      setForm({ questionText: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', marks: 1, topic: '', difficulty: 'medium' });
      fetch();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (qid) => {
    try { await api.delete(`/api/exams/${id}/questions/${qid}`); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  const downloadPDF = async (type) => {
    try {
      const res = await api.get(`/api/exams/${id}/${type}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${type}_${id}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/teacher/exams')} className="p-2 hover:bg-gray-100 rounded-lg"><FiArrowLeft className="w-5 h-5" /></button>
          <div>
            <h2 className="text-2xl font-bold">{exam.title}</h2>
            <p className="text-sm text-gray-500">{exam.subject_name} - {exam.class_name} | {questions.length} questions | {exam.total_marks} marks</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => downloadPDF('pdf')} className="bg-gray-100 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">Download Paper</button>
          <button onClick={() => downloadPDF('omr')} className="bg-gray-100 px-3 py-2 rounded-lg text-sm hover:bg-gray-200">Download OMR</button>
          <button onClick={() => setShowModal(true)} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add Question</button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map(q => (
          <div key={q.id} className="bg-white rounded-xl shadow-sm border p-5">
            <div className="flex justify-between items-start">
              <div className="flex gap-2 flex-wrap">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">Q{q.question_number}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${q.type === 'multiple_choice' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{q.type}</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{q.marks} marks</span>
              </div>
              <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-700"><FiTrash2 className="w-4 h-4" /></button>
            </div>
            <p className="mt-3 font-medium">{q.question_text}</p>
            {q.type === 'multiple_choice' && q.options && (() => {
              try {
                const opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                return <div className="mt-3 grid grid-cols-2 gap-2">{opts.map((o, j) => (<div key={j} className={`p-2 rounded text-sm ${q.correct_answer === o ? 'bg-green-50 text-green-700 font-medium border border-green-200' : 'bg-gray-50'}`}>{String.fromCharCode(65 + j)}. {o}</div>))}</div>;
              } catch { return null; }
            })()}
          </div>
        ))}
      </div>

      {questions.length === 0 && (<div className="text-center py-12"><p className="text-gray-500 mb-4">No questions yet</p><button onClick={() => setShowModal(true)} className="bg-kosora-600 text-white px-6 py-3 rounded-lg">Add First Question</button></div>)}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add Question</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea required className="w-full px-3 py-2 border rounded-lg" rows={3} value={form.questionText} onChange={(e) => setForm({...form, questionText: e.target.value})} placeholder="Enter your question..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                  <select className="w-full px-3 py-2 border rounded-lg" value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}><option value="multiple_choice">Multiple Choice</option><option value="short_answer">Short Answer</option><option value="essay">Essay</option></select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input type="number" min={1} className="w-full px-3 py-2 border rounded-lg" value={form.marks} onChange={(e) => setForm({...form, marks: parseInt(e.target.value) || 1})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select className="w-full px-3 py-2 border rounded-lg" value={form.difficulty} onChange={(e) => setForm({...form, difficulty: e.target.value})}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
                </div>
              </div>
              {form.type === 'multiple_choice' && (<>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  <div className="grid grid-cols-2 gap-3">{form.options.map((opt, i) => (<div key={i} className="flex items-center space-x-2"><span className="font-medium w-6">{String.fromCharCode(65 + i)}.</span><input className="w-full px-2 py-1 border rounded text-sm" value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({...form, options: o}); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} /></div>))}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correct Answer</label>
                  <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Exact match of the correct option" value={form.correctAnswer} onChange={(e) => setForm({...form, correctAnswer: e.target.value})} />
                </div>
              </>)}
              {form.type === 'short_answer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer</label>
                  <textarea required className="w-full px-3 py-2 border rounded-lg" rows={2} value={form.correctAnswer} onChange={(e) => setForm({...form, correctAnswer: e.target.value})} placeholder="Enter the expected answer..." />
                </div>
              )}
              {form.type === 'essay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer Guidelines</label>
                  <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={form.correctAnswer} onChange={(e) => setForm({...form, correctAnswer: e.target.value})} placeholder="Describe what a good answer should include..." />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic (optional)</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} placeholder="e.g. Algebra, Geometry..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-kosora-600 text-white py-2 rounded-lg">Add Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamEditor;
