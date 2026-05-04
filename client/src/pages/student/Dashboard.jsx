import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';

const StudentDashboard = () => {
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  const recent = results.slice(0, 5);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link to="/student/results" className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md cursor-pointer">
          <h3 className="font-semibold text-lg mb-2">My Results</h3>
          <p className="text-sm text-gray-500">View exam scores and performance</p>
        </Link>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-lg mb-2">Recent Exams</h3>
          {recent.length ? recent.map(r => (<div key={r.id} className="p-2 bg-gray-50 rounded mb-2"><p className="font-medium text-sm">{r.title}</p><p className="text-xs text-gray-500">{r.subject_name} - {r.score}/{r.total_marks} - Grade: {r.grade}</p></div>)) : <p className="text-gray-500 text-sm">No results yet</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
