import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiCpu, FiEdit3, FiPlus, FiX, FiTrash2 } from 'react-icons/fi';

const ExamGenerator = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(1);
  const [creationMode, setCreationMode] = useState(null);

  const [examData, setExamData] = useState({
    title: '', subjectId: '', classId: '', instructions: '',
    durationMinutes: 60, passingMarks: 50, term: 'Term 1',
    academicYear: '2025-2026', assessmentType: 'exam'
  });
  const [genOptions, setGenOptions] = useState({ materialIds: [], questionCount: 10, difficulty: 'medium' });
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [examId, setExamId] = useState(null);

  const [manualQuestions, setManualQuestions] = useState([]);
  const [showAddQ, setShowAddQ] = useState(false);
  const [qForm, setQForm] = useState({ questionText: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', marks: 1, topic: '', difficulty: 'medium' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [m, s, c] = await Promise.all([api.get('/api/materials?limit=100'), api.get('/api/school/subjects'), api.get('/api/school/classes')]);
      setMaterials(m.data.materials || []);
      setSubjects(s.data.subjects || []);
      setClasses(c.data.classes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/exams', examData);
      setExamId(res.data.exam.id);
      toast.success(`${examData.assessmentType === 'exam' ? 'Exam' : examData.assessmentType === 'quiz' ? 'Quiz' : 'Assessment'} created`);
      setStep(2);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleGenerate = async () => {
    if (genOptions.materialIds.length === 0) return toast.error('Select at least one material');
    if (materials.length === 0) return toast.error('Upload learning materials first');
    setGenerating(true);
    try {
      const res = await api.post(`/api/exams/${examId}/generate-questions`, genOptions);
      setGeneratedQuestions(res.data.questions || []);
      toast.success(`Generated ${res.data.questions?.length || 0} questions`);
      setStep(3);
    } catch (err) {
      const msg = err.response?.data?.error || 'Generation failed';
      if (msg.includes('Ollama') || msg.includes('ECONNREFUSED')) {
        toast.error('Ollama is not running. Install Ollama (https://ollama.ai) and run: ollama pull llama3');
      } else {
        toast.error(msg);
      }
    }
    finally { setGenerating(false); }
  };

  const handleSaveGenerated = async () => {
    try {
      await api.post(`/api/exams/${examId}/questions`, { questions: generatedQuestions });
      toast.success('Questions saved');
      navigate(`/teacher/exams/${examId}/edit`);
    } catch { toast.error('Failed to save'); }
  };

  const handleSaveManual = async () => {
    if (manualQuestions.length === 0) return toast.error('Add at least one question');
    try {
      await api.post(`/api/exams/${examId}/questions`, { questions: manualQuestions });
      toast.success('Questions saved');
      navigate(`/teacher/exams/${examId}/edit`);
    } catch { toast.error('Failed to save'); }
  };

  const addManualQuestion = () => {
    if (!qForm.questionText.trim() || !qForm.correctAnswer.trim()) return toast.error('Question text and correct answer required');
    const newQ = {
      ...qForm,
      options: qForm.type === 'multiple_choice' ? [...qForm.options] : [],
      questionNumber: manualQuestions.length + 1
    };
    setManualQuestions([...manualQuestions, newQ]);
    setShowAddQ(false);
    setQForm({ questionText: '', type: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', marks: 1, topic: '', difficulty: 'medium' });
  };

  const removeManualQ = (i) => setManualQuestions(manualQuestions.filter((_, idx) => idx !== i));

  const editGenQ = (i, f, v) => { const u = [...generatedQuestions]; u[i] = { ...u[i], [f]: v }; setGeneratedQuestions(u); };
  const removeGenQ = (i) => setGeneratedQuestions(generatedQuestions.filter((_, idx) => idx !== i));

  const assessmentLabels = { exam: 'Exam', quiz: 'Quiz', short_assessment: 'Short Assessment' };
  const assessmentDesc = {
    exam: 'Full exam with multiple sections and time limit',
    quiz: 'Quick test with fewer questions',
    short_assessment: 'Brief assessment or class test'
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Create Assessment</h2>

      <div className="flex items-center space-x-4 mb-6">
        {[{ n: 1, l: 'Details' }, { n: 2, l: creationMode === 'ai' ? 'Generate' : 'Questions' }, { n: 3, l: 'Review' }].map((s, i) => (
          <React.Fragment key={s.n}>
            {i > 0 && <div className="flex-1 h-0.5 bg-gray-200"><div className={`h-full bg-kosora-600 transition-all ${step > s.n - 1 ? 'w-full' : 'w-0'}`}></div></div>}
            <div className={`flex items-center space-x-2 ${step === s.n ? 'text-kosora-600' : step > s.n ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step > s.n ? 'bg-green-600 text-white' : step === s.n ? 'bg-kosora-600 text-white' : 'bg-gray-200'}`}>{step > s.n ? '✓' : s.n}</div>
              <span className="text-sm font-medium hidden sm:inline">{s.l}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Step 1: Assessment Details</h3>
          <form onSubmit={handleCreateExam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(assessmentLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setExamData({ ...examData, assessmentType: key })}
                    className={`p-3 rounded-lg border text-center transition ${examData.assessmentType === key ? 'border-kosora-500 bg-kosora-50 text-kosora-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-xs text-gray-500 mt-1">{assessmentDesc[key]}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder={examData.assessmentType === 'exam' ? 'e.g. Mid-Term Mathematics Exam' : examData.assessmentType === 'quiz' ? 'e.g. Chapter 5 Quiz' : 'e.g. Class Test - Algebra'} value={examData.title} onChange={(e) => setExamData({ ...examData, title: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select required className="w-full px-3 py-2 border rounded-lg" value={examData.subjectId} onChange={(e) => setExamData({ ...examData, subjectId: e.target.value })}>
                  <option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select required className="w-full px-3 py-2 border rounded-lg" value={examData.classId} onChange={(e) => setExamData({ ...examData, classId: e.target.value })}>
                  <option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions (optional)</label>
              <textarea className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Answer all questions. No calculators allowed." rows={2} value={examData.instructions} onChange={(e) => setExamData({ ...examData, instructions: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg" value={examData.durationMinutes} onChange={(e) => setExamData({ ...examData, durationMinutes: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
                <input type="number" className="w-full px-3 py-2 border rounded-lg" value={examData.passingMarks} onChange={(e) => setExamData({ ...examData, passingMarks: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={examData.term} onChange={(e) => setExamData({ ...examData, term: e.target.value })}>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={examData.academicYear} onChange={(e) => setExamData({ ...examData, academicYear: e.target.value })} placeholder="2025-2026" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">How do you want to create questions?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="submit" onClick={() => setCreationMode('ai')} className="p-4 border-2 rounded-xl text-left hover:border-kosora-500 hover:bg-kosora-50 transition group">
                  <div className="flex items-center gap-2 mb-1">
                    <FiCpu className="w-5 h-5 text-kosora-600" />
                    <span className="font-semibold text-kosora-700">Generate with AI</span>
                  </div>
                  <p className="text-xs text-gray-500">Auto-generate from uploaded materials using Ollama</p>
                </button>
                <button type="submit" onClick={() => setCreationMode('manual')} className="p-4 border-2 rounded-xl text-left hover:border-kosora-500 hover:bg-kosora-50 transition group">
                  <div className="flex items-center gap-2 mb-1">
                    <FiEdit3 className="w-5 h-5 text-kosora-600" />
                    <span className="font-semibold text-kosora-700">Create Manually</span>
                  </div>
                  <p className="text-xs text-gray-500">Write your own questions one by one</p>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {step === 2 && creationMode === 'ai' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Step 2: Generate Questions with AI</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">AI-powered question generation using <strong>Groq API</strong> (Llama 3.1). No local installation needed.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Learning Materials</label>
              {materials.length === 0 ? (
                <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">No materials uploaded. <a href="/teacher/materials" className="text-kosora-600 underline">Upload materials first</a></p>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {materials.map(m => (
                    <label key={m.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input type="checkbox" checked={genOptions.materialIds.includes(m.id)} onChange={(e) => { const ids = e.target.checked ? [...genOptions.materialIds, m.id] : genOptions.materialIds.filter(id => id !== m.id); setGenOptions({ ...genOptions, materialIds: ids }); }} />
                      <span className="text-sm">{m.title}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Questions</label>
                <input type="number" min={1} max={50} className="w-full px-3 py-2 border rounded-lg" value={genOptions.questionCount} onChange={(e) => setGenOptions({ ...genOptions, questionCount: parseInt(e.target.value) })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={genOptions.difficulty} onChange={(e) => setGenOptions({ ...genOptions, difficulty: e.target.value })}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 py-3 rounded-lg hover:bg-gray-200">Back</button>
              <button onClick={handleGenerate} disabled={generating} className="flex-1 bg-kosora-600 text-white py-3 rounded-lg hover:bg-kosora-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <FiCpu className="w-5 h-5" /> {generating ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && creationMode === 'manual' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Questions ({manualQuestions.length})</h3>
            <div className="flex gap-2">
              {manualQuestions.length > 0 && (
                <button onClick={handleSaveManual} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2">Save All</button>
              )}
              <button onClick={() => setShowAddQ(true)} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2"><FiPlus className="w-4 h-4" /> Add Question</button>
            </div>
          </div>

          {manualQuestions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
              <FiEdit3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No questions yet. Start adding questions manually.</p>
              <button onClick={() => setShowAddQ(true)} className="bg-kosora-600 text-white px-6 py-3 rounded-lg hover:bg-kosora-700 flex items-center gap-2 mx-auto"><FiPlus className="w-4 h-4" /> Add First Question</button>
            </div>
          )}

          {manualQuestions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex justify-between"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">Q{i + 1}</span><button onClick={() => removeManualQ(i)} className="text-red-500 text-sm">Remove</button></div>
              <p className="mt-3 font-medium">{q.questionText}</p>
              {q.type === 'multiple_choice' && q.options && q.options.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {q.options.filter(o => o.trim()).map((opt, j) => (
                    <div key={j} className={`p-2 rounded text-sm ${q.correctAnswer === opt ? 'bg-green-50 text-green-700 font-medium border border-green-200' : 'bg-gray-50'}`}>{String.fromCharCode(65 + j)}. {opt}</div>
                  ))}
                </div>
              )}
              {q.type === 'short_answer' && <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">Answer: {q.correctAnswer}</p>}
              <div className="mt-2 flex gap-2 text-xs text-gray-500">
                <span className="capitalize bg-gray-100 px-2 py-0.5 rounded">{q.type.replace('_', ' ')}</span>
                <span>{q.marks} marks</span>
                <span className="capitalize">{q.difficulty}</span>
                {q.topic && <span>{q.topic}</span>}
              </div>
            </div>
          ))}

          {manualQuestions.length > 0 && (
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 py-3 rounded-lg hover:bg-gray-200">Back</button>
            </div>
          )}
        </div>
      )}

      {step === 3 && creationMode === 'ai' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Review & Edit ({generatedQuestions.length})</h3>
            <button onClick={handleSaveGenerated} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700">Save All Questions</button>
          </div>
          {generatedQuestions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex justify-between"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">Q{i + 1}</span><button onClick={() => removeGenQ(i)} className="text-red-500 text-sm">Remove</button></div>
              <textarea className="w-full px-3 py-2 border rounded-lg mt-3" rows={2} value={q.questionText} onChange={(e) => editGenQ(i, 'questionText', e.target.value)} />
              {q.type === 'multiple_choice' && q.options && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {q.options.map((opt, j) => (
                    <div key={j} className="flex items-center space-x-2"><span className="font-medium w-6">{String.fromCharCode(65 + j)}.</span><input className="w-full px-2 py-1 border rounded text-sm" value={opt} onChange={(e) => { const o = [...q.options]; o[j] = e.target.value; editGenQ(i, 'options', o); }} /></div>
                  ))}
                </div>
              )}
              <div className="mt-3 grid grid-cols-3 gap-3">
                <input className="px-3 py-2 border rounded-lg text-sm" placeholder="Correct Answer" value={q.correctAnswer} onChange={(e) => editGenQ(i, 'correctAnswer', e.target.value)} />
                <input type="number" className="px-3 py-2 border rounded-lg text-sm" placeholder="Marks" value={q.marks} onChange={(e) => editGenQ(i, 'marks', parseInt(e.target.value) || 1)} />
                <select className="px-3 py-2 border rounded-lg text-sm" value={q.difficulty} onChange={(e) => editGenQ(i, 'difficulty', e.target.value)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Question</h3>
              <button onClick={() => setShowAddQ(false)}><FiX className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea required className="w-full px-3 py-2 border rounded-lg" rows={3} value={qForm.questionText} onChange={(e) => setQForm({ ...qForm, questionText: e.target.value })} placeholder="Enter your question..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                  <select className="w-full px-3 py-2 border rounded-lg" value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value })}>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input type="number" min={1} className="w-full px-3 py-2 border rounded-lg" value={qForm.marks} onChange={(e) => setQForm({ ...qForm, marks: parseInt(e.target.value) || 1 })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select className="w-full px-3 py-2 border rounded-lg" value={qForm.difficulty} onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value })}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
              {qForm.type === 'multiple_choice' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options (mark correct one)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {qForm.options.map((opt, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <input type="radio" name="correctOpt" checked={qForm.correctAnswer === opt && opt.trim()} onChange={() => setQForm({ ...qForm, correctAnswer: opt })} className="flex-shrink-0" />
                        <span className="font-medium w-6 text-sm">{String.fromCharCode(65 + i)}.</span>
                        <input className="flex-1 px-2 py-1 border rounded text-sm" value={opt} onChange={(e) => { const o = [...qForm.options]; o[i] = e.target.value; setQForm({ ...qForm, options: o }); }} placeholder={`Option ${String.fromCharCode(65 + i)}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {qForm.type === 'short_answer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer</label>
                  <textarea required className="w-full px-3 py-2 border rounded-lg" rows={2} value={qForm.correctAnswer} onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })} placeholder="Enter the expected answer..." />
                </div>
              )}
              {qForm.type === 'essay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Answer Guidelines</label>
                  <textarea className="w-full px-3 py-2 border rounded-lg" rows={2} value={qForm.correctAnswer} onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })} placeholder="Describe what a good answer should include..." />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic (optional)</label>
                <input className="w-full px-3 py-2 border rounded-lg" value={qForm.topic} onChange={(e) => setQForm({ ...qForm, topic: e.target.value })} placeholder="e.g. Algebra, Geometry..." />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAddQ(false)} className="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="button" onClick={addManualQuestion} className="flex-1 bg-kosora-600 text-white py-2 rounded-lg hover:bg-kosora-700">Add Question</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamGenerator;
