import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit, FiTrash2, FiDownload, FiFile } from 'react-icons/fi';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const res = await api.get('/api/exams?limit=100');
      setExams(res.data.exams || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/api/exams/${id}`); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  const handleFinalize = async (id) => {
    try { await api.put(`/api/exams/${id}/finalize`); toast.success('Finalized'); fetch(); } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const downloadPDF = async (examId, type) => {
    try {
      const res = await api.get(`/api/exams/${examId}/${type}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = `${type}_${examId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Exams & Assessments</h2>
        <Link to="/teacher/exams/generate" className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Create New
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{exam.title}</h3>
              <div className="flex gap-1">
                {exam.assessment_type && exam.assessment_type !== 'exam' && (
                  <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${exam.assessment_type === 'quiz' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>{exam.assessment_type.replace('_', ' ')}</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${exam.status === 'finalized' ? 'bg-green-100 text-green-800' : exam.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{exam.status}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">{exam.subject_name} - {exam.class_name}</p>
            <div className="mt-3 text-sm text-gray-600 space-y-1">
              <p>Questions: {exam.question_count}</p>
              <p>Total Marks: {exam.total_marks}</p>
              <p className="text-xs font-mono text-gray-400">{exam.exam_code}</p>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link to={`/teacher/exams/${exam.id}/edit`} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"><FiEdit className="w-3 h-3" /> Edit</Link>
              {exam.status === 'draft' && <button onClick={() => handleFinalize(exam.id)} className="bg-kosora-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-kosora-700">Finalize</button>}
              <button onClick={() => downloadPDF(exam.id, 'pdf')} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"><FiDownload className="w-3 h-3" /> Paper</button>
              <button onClick={() => downloadPDF(exam.id, 'omr')} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-1"><FiFile className="w-3 h-3" /> OMR</button>
              <button onClick={() => handleDelete(exam.id)} className="text-red-600 px-2 py-1.5 rounded-lg text-sm hover:bg-red-50"><FiTrash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {exams.length === 0 && (<div className="text-center py-12"><p className="text-gray-500 mb-4">No exams or assessments yet</p><Link to="/teacher/exams/generate" className="bg-kosora-600 text-white px-6 py-3 rounded-lg">Create Your First Assessment</Link></div>)}
    </div>
  );
};

export default Exams;
