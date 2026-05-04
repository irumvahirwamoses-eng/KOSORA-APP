import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const StudentResults = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const res = await api.get(`/api/reports/student/${user?.id}/performance`);
      setResults(res.data.results || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const chartData = {
    labels: results.map(r => r.subject_name?.substring(0, 10) || '?'),
    datasets: [{ label: 'Score %', data: results.map(r => parseFloat(r.percentage) || 0), backgroundColor: results.map(r => (parseFloat(r.percentage) || 0) >= 50 ? 'rgba(34,197,94,0.7)' : 'rgba(239,68,68,0.7)'), borderRadius: 4 }]
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Results</h2>
      {results.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Exam</th><th className="text-left py-3 px-4 text-sm text-gray-600">Subject</th><th className="text-center py-3 px-4 text-sm text-gray-600">Score</th><th className="text-center py-3 px-4 text-sm text-gray-600">%</th><th className="text-center py-3 px-4 text-sm text-gray-600">Grade</th><th className="text-left py-3 px-4 text-sm text-gray-600">Term</th></tr></thead>
          <tbody>{results.map(r => (
            <tr key={r.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-medium">{r.title}</td>
              <td className="py-3 px-4">{r.subject_name}</td>
              <td className="py-3 px-4 text-center">{r.score}/{r.total_marks}</td>
              <td className="py-3 px-4 text-center">{r.percentage}%</td>
              <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 rounded-full text-xs ${parseFloat(r.percentage) >= 50 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.grade}</span></td>
              <td className="py-3 px-4 text-sm">{r.term} {r.academic_year}</td>
            </tr>
          ))}</tbody>
        </table>
        {results.length === 0 && <p className="text-gray-500 text-center py-8">No results yet</p>}
      </div>
    </div>
  );
};

export default StudentResults;
