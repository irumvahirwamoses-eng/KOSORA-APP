import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ClassReportCards = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState('2024-2025');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [c, s] = await Promise.all([api.get('/api/school/classes'), api.get('/api/students?limit=500')]);
      setClasses(c.data.classes || []);
      setStudents(s.data.students || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleGenerate = async (studentId) => {
    setGenerating(true);
    try {
      const res = await api.post('/api/reports/report-card', { studentId, term, academicYear: year });
      setReport(res.data);
      toast.success('Report card generated');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setGenerating(false); }
  };

  const handleDownload = async (studentId) => {
    try {
      const res = await api.get(`/api/reports/report-card/${studentId}/${term}/${year}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `report_card_${studentId}_${term}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Downloaded');
    } catch { toast.error('Failed to download'); }
  };

  const handleGenerateAll = async () => {
    setGenerating(true);
    const list = selectedClass ? students.filter(s => s.class_id === parseInt(selectedClass)) : students;
    for (const s of list) { try { await api.post('/api/reports/report-card', { studentId: s.id, term, academicYear: year }); } catch {} }
    toast.success(`Generated for ${list.length} students`);
    setGenerating(false);
  };

  const filtered = selectedClass ? students.filter(s => s.class_id === parseInt(selectedClass)) : students;

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Class Report Cards</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div><label className="text-sm font-medium block mb-1">Class</label><select className="w-full px-3 py-2 border rounded-lg" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="text-sm font-medium block mb-1">Term</label><select className="w-full px-3 py-2 border rounded-lg" value={term} onChange={(e) => setTerm(e.target.value)}><option>Term 1</option><option>Term 2</option><option>Term 3</option></select></div>
          <div><label className="text-sm font-medium block mb-1">Academic Year</label><input className="w-full px-3 py-2 border rounded-lg" value={year} onChange={(e) => setYear(e.target.value)} /></div>
          <div className="flex items-end"><button onClick={handleGenerateAll} disabled={generating} className="w-full bg-kosora-600 text-white py-2 rounded-lg hover:bg-kosora-700 disabled:opacity-50">{generating ? 'Generating...' : 'Generate All'}</button></div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th><th className="text-left py-3 px-4 text-sm text-gray-600">Class</th><th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th></tr></thead>
          <tbody>{filtered.map(s => (
            <tr key={s.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">{s.student_code}</td>
              <td className="py-3 px-4 font-medium">{s.name}</td>
              <td className="py-3 px-4"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{s.class_name}</span></td>
              <td className="py-3 px-4 flex gap-2">
                <button onClick={() => handleGenerate(s.id)} className="bg-gray-100 px-3 py-1 rounded-lg text-sm hover:bg-gray-200">Generate</button>
                <button onClick={() => handleDownload(s.id)} className="bg-gray-100 px-3 py-1 rounded-lg text-sm hover:bg-gray-200">PDF</button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {report && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-3">{report.student.student_name} - {report.term} {report.academicYear}</h3>
          <table className="w-full">
            <thead><tr className="bg-gray-50"><th className="text-left py-2 px-3 text-sm">Subject</th><th className="text-center py-2 px-3 text-sm">Average</th><th className="text-center py-2 px-3 text-sm">Grade</th></tr></thead>
            <tbody>
              {report.subjects.map((s, i) => (<tr key={i} className="border-b"><td className="py-2 px-3">{s.subject}</td><td className="py-2 px-3 text-center">{s.average}%</td><td className="py-2 px-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${s.average >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.grade}</span></td></tr>))}
              <tr className="bg-gray-50 font-bold"><td className="py-2 px-3">Overall</td><td className="py-2 px-3 text-center">{report.overallPercentage}%</td><td className="py-2 px-3 text-center">{report.overallGrade}</td></tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClassReportCards;
