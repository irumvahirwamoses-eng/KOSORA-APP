import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiSearch } from 'react-icons/fi';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', classId: '', enrollmentDate: '', parentName: '', parentPhone: '' });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const [s, c] = await Promise.all([api.get('/api/students?limit=500'), api.get('/api/school/classes')]);
      setStudents(s.data.students || []);
      setClasses(c.data.classes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = students.filter(s => {
    const mc = !selectedClass || s.class_id === parseInt(selectedClass);
    const ms = !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/students', { ...form, schoolId: null });
      toast.success('Student created (default password: student123)');
      setShowModal(false);
      setForm({ name: '', email: '', phone: '', classId: '', enrollmentDate: '', parentName: '', parentPhone: '' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try { await api.delete(`/api/students/${id}`); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Student Management</h2>
        <button onClick={() => setShowModal(true)} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add Student
        </button>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1"><FiSearch className="absolute left-3 top-2.5 text-gray-400" /><input className="w-full pl-10 px-3 py-2 border rounded-lg" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <select className="px-3 py-2 border rounded-lg" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
          <option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Code</th><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th><th className="text-left py-3 px-4 text-sm text-gray-600">Email</th><th className="text-left py-3 px-4 text-sm text-gray-600">Class</th><th className="text-left py-3 px-4 text-sm text-gray-600">Actions</th></tr></thead>
          <tbody>{filtered.map(s => (
            <tr key={s.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-mono text-sm">{s.student_code}</td>
              <td className="py-3 px-4 font-medium">{s.name}</td>
              <td className="py-3 px-4 text-sm">{s.email}</td>
              <td className="py-3 px-4"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{s.class_name}</span></td>
              <td className="py-3 px-4"><button onClick={() => handleDelete(s.id)} className="text-red-600 text-sm hover:underline">Delete</button></td>
            </tr>
          ))}</tbody>
        </table>
        {filtered.length === 0 && <p className="text-gray-500 text-center py-8">No students found</p>}
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Add Student</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Full Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              <input type="email" required className="w-full px-3 py-2 border rounded-lg" placeholder="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Phone" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
              <select required className="w-full px-3 py-2 border rounded-lg" value={form.classId} onChange={(e) => setForm({...form, classId: e.target.value})}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input type="date" className="w-full px-3 py-2 border rounded-lg" value={form.enrollmentDate} onChange={(e) => setForm({...form, enrollmentDate: e.target.value})} />
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Parent Name" value={form.parentName} onChange={(e) => setForm({...form, parentName: e.target.value})} />
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Parent Phone" value={form.parentPhone} onChange={(e) => setForm({...form, parentPhone: e.target.value})} />
              <p className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">Default password: student123</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 bg-kosora-600 text-white py-2 rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
