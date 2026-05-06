import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0, totalExams: 0, totalMaterials: 0 });
  const [recentExams, setRecentExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const res = await api.get('/api/reports/dashboard');
      setStats(res.data.stats || {});
      setRecentExams(res.data.recentExams || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{user?.schoolName ? `${user.schoolName} - Admin Dashboard` : 'School Admin Dashboard'}</h2>
        <p className="text-gray-500 mt-1">Welcome, {user?.name}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Students', value: stats.totalStudents, color: 'blue', link: '/admin/students' },
          { label: 'Teachers', value: stats.totalTeachers, color: 'green', link: '/admin/users' },
          { label: 'Exams', value: stats.totalExams, color: 'purple', link: '/teacher/exams' },
          { label: 'Materials', value: stats.totalMaterials, color: 'orange' },
        ].map((s, i) => (
          <Link key={i} to={s.link || '#'} className={`bg-white rounded-xl shadow-sm border p-6 flex items-center space-x-4 ${s.link ? 'cursor-pointer hover:shadow-md' : ''}`}>
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 text-${s.color}-600 flex items-center justify-center font-bold text-lg`}>{s.value}</div>
            <p className="text-sm text-gray-600">{s.label}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-3">Recent Exams</h3>
          {recentExams.length ? recentExams.map(e => (
            <div key={e.id} className="p-2 bg-gray-50 rounded mb-2"><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-gray-500">{e.subject_name} - {e.class_name}</p></div>
          )) : <p className="text-gray-500 text-sm">No exams yet</p>}
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[{ l: 'Manage Students', p: '/admin/students' }, { l: 'Report Cards', p: '/admin/report-cards' }, { l: 'Manage Users', p: '/admin/users' }].map(a => (
              <Link key={a.p} to={a.p} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium">{a.l}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
