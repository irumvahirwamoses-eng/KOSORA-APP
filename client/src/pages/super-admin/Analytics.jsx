import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { FiUsers, FiBookOpen, FiFileText, FiAward, FiTrendingUp } from 'react-icons/fi';

const Analytics = () => {
  const [data, setData] = useState({ stats: {}, recentActivity: [], topSchools: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const res = await api.get('/api/reports/system-overview');
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  const { stats } = data;

  const cards = [
    { icon: FiBookOpen, label: 'Total Schools', value: stats.totalSchools, color: 'blue' },
    { icon: FiUsers, label: 'Total Users', value: stats.totalUsers, color: 'green' },
    { icon: FiFileText, label: 'Total Exams', value: stats.totalExams, color: 'purple' },
    { icon: FiAward, label: 'Total Students', value: stats.totalStudents, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg bg-${c.color}-50 text-${c.color}-600 flex items-center justify-center`}><c.icon className="w-6 h-6" /></div>
            <div><p className="text-2xl font-bold">{c.value}</p><p className="text-sm text-gray-500">{c.label}</p></div>
          </div>
        ))}
      </div>

      {stats.roles && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Users by Role</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.roles).map(([role, count]) => (
              <div key={role} className="p-3 bg-gray-50 rounded-lg text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{role.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">Top Schools by Users</h3>
          {data.topSchools.length ? data.topSchools.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded mb-2">
              <div><p className="font-medium text-sm">{s.name}</p><p className="text-xs text-gray-500">{s.code}</p></div>
              <div className="text-right text-sm"><p>{s.user_count} users</p><p className="text-xs text-gray-500">{s.exam_count} exams</p></div>
            </div>
          )) : <p className="text-gray-500 text-sm">No data</p>}
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-3"><FiTrendingUp className="inline mr-2" />Recent Activity</h3>
          {data.recentActivity.length ? data.recentActivity.map((a, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded mb-2">
              <p className="font-medium text-sm">{a.name}</p>
              <p className="text-xs text-gray-500">{a.school_name} - {new Date(a.created_at).toLocaleDateString()}</p>
            </div>
          )) : <p className="text-gray-500 text-sm">No recent activity</p>}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
