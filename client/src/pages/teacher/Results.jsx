import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement);

const Results = () => {
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedExam, setSelectedExam] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchExams(); }, []);
  useEffect(() => { if (selectedExam) fetchResults(); }, [selectedExam]);

  const fetchExams = async () => {
    try { const res = await api.get('/api/exams?limit=100'); setExams(res.data.exams || []); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchResults = async () => {
    try { const res = await api.get(`/api/reports/class-results?examId=${selectedExam}`); setResults(res.data.results || []); setStats(res.data.stats || {}); } catch { setResults([]); setStats({}); }
  };

  const barData = {
    labels: results.map(r => r.student_name?.split(' ')[0] || '?'),
    datasets: [{ label: 'Score %', data: results.map(r => parseFloat(r.percentage) || 0), backgroundColor: results.map(r => (parseFloat(r.percentage) || 0) >= 50 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'), borderRadius: 4 }]
  };

  const doughnutData = {
    labels: ['Passed', 'Failed'],
    datasets: [{ data: [stats.passed || 0, stats.failed || 0], backgroundColor: ['rgba(34,197,94,0.7)', 'rgba(239,68,68,0.7)'] }]
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Results & Analytics</h2>
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <label className="block text-sm font-medium mb-2">Select Exam</label>
        <select className="px-3 py-2 border rounded-lg" value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
          <option value="">Select an exam</option>{exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.exam_code})</option>)}
        </select>
      </div>

      {selectedExam && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{ l: 'Students', v: stats.totalStudents || 0 }, { l: 'Average', v: `${stats.average || 0}%` }, { l: 'Passed', v: stats.passed || 0, c: 'text-green-600' }, { l: 'Failed', v: stats.failed || 0, c: 'text-red-600' }].map((s, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border p-6"><p className={`text-2xl font-bold ${s.c || ''}`}>{s.v}</p><p className="text-sm text-gray-500">{s.l}</p></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border p-6"><h3 className="text-lg font-semibold mb-4">Score Distribution</h3><Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} /></div>
            <div className="bg-white rounded-xl shadow-sm border p-6"><h3 className="text-lg font-semibold mb-4">Pass/Fail</h3><Doughnut data={doughnutData} options={{ responsive: true }} /></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
            <h3 className="text-lg font-semibold p-6 pb-0">Detailed Results</h3>
            <table className="w-full mt-4">
              <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Student</th><th className="text-left py-3 px-4 text-sm text-gray-600">Code</th><th className="text-center py-3 px-4 text-sm text-gray-600">Score</th><th className="text-center py-3 px-4 text-sm text-gray-600">%</th><th className="text-center py-3 px-4 text-sm text-gray-600">Grade</th></tr></thead>
              <tbody>{results.map(r => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{r.student_name}</td>
                  <td className="py-3 px-4 font-mono text-sm">{r.student_code}</td>
                  <td className="py-3 px-4 text-center">{r.score}/{r.total_marks}</td>
                  <td className="py-3 px-4 text-center">{r.percentage}%</td>
                  <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${parseFloat(r.percentage) >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.grade}</span></td>
                </tr>
              ))}</tbody>
            </table>
            {results.length === 0 && <p className="text-gray-500 text-center py-8">No results for this exam</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default Results;
