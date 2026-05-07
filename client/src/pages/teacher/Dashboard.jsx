import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalMaterials: 0, totalExams: 0 });
  const [recentExams, setRecentExams] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const [dash, classesRes, subjectsRes] = await Promise.all([
        api.get('/api/reports/dashboard'),
        api.get('/api/school/classes'),
        api.get('/api/school/subjects'),
      ]);
      setStats(dash.data.stats || {});
      setRecentExams(dash.data.recentExams || []);
      const allClasses = classesRes.data.classes || [];
      setMyClasses(allClasses.filter(c => c.teacher_id === user?.id));
      setMySubjects(subjectsRes.data.subjects || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome, {user?.name} {user?.schoolName ? `— ${user.schoolName}` : ''}</h2>
        <p className="text-gray-500 mt-1">Teacher Dashboard</p>
      </div>

      {myClasses.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-3">My Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myClasses.map(c => (
              <div key={c.id} className="p-4 bg-kosora-50 rounded-lg border border-kosora-200">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-gray-600">Grade {c.grade_level} • {c.academic_year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[{ l: 'Materials', v: stats.totalMaterials, p: '/teacher/materials' }, { l: 'Exams', v: stats.totalExams, p: '/teacher/exams' }, { l: 'Scans', v: 0, p: '/teacher/scanning' }, { l: 'Results', v: '--', p: '/teacher/results' }].map((s, i) => (
          <Link key={i} to={s.p} className="bg-white rounded-xl shadow-sm border p-6 flex items-center space-x-4 hover:shadow-md">
            <div className="w-10 h-10 rounded-lg bg-kosora-100 text-kosora-600 flex items-center justify-center font-bold">{s.v}</div>
            <p className="text-sm text-gray-600">{s.l}</p>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-3">Recent Exams</h3>
          {recentExams.length ? recentExams.map(e => (<div key={e.id} className="p-2 bg-gray-50 rounded mb-2"><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-gray-500">{e.subject_name} - {e.class_name}</p></div>)) : <p className="text-gray-500 text-sm">No exams</p>}
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
          <div className="space-y-2">
            {[{ l: 'Upload Material', p: '/teacher/materials' }, { l: 'Generate Exam (AI)', p: '/teacher/exams/generate' }, { l: 'Scan OMR', p: '/teacher/scanning' }, { l: 'View Results', p: '/teacher/results' }].map(a => (<Link key={a.p} to={a.p} className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 text-sm font-medium">{a.l}</Link>))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
