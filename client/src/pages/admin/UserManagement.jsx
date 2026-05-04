import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX } from 'react-icons/fi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'teacher' });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const res = await api.get(`/api/school/users?limit=100${filter ? '&role=' + filter : ''}`);
      setUsers(res.data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggle = async (id, active) => {
    try { await api.put(`/api/school/users/${id}/status`, { isActive: !active }); toast.success('Updated'); fetch(); } catch { toast.error('Failed'); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/school/users', form);
      toast.success(`${form.role === 'teacher' ? 'Teacher' : 'Admin'} created`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '', role: 'teacher' });
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex gap-3">
          <select className="px-3 py-2 border rounded-lg" value={filter} onChange={(e) => { setFilter(e.target.value); fetch(); }}>
            <option value="">All</option><option value="teacher">Teachers</option><option value="student">Students</option><option value="admin">Admins</option>
          </select>
          <button onClick={() => setShowModal(true)} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2">
            <FiPlus className="w-4 h-4" /> Add Teacher/Admin
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b"><th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Name</th><th className="text-left py-3 px-4 text-sm text-gray-600">Email</th><th className="text-left py-3 px-4 text-sm text-gray-600">Role</th><th className="text-left py-3 px-4 text-sm text-gray-600">Status</th><th className="text-left py-3 px-4 text-sm text-gray-600">Action</th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4 font-medium">{u.name}</td>
              <td className="py-3 px-4 text-sm">{u.email}</td>
              <td className="py-3 px-4"><span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">{u.role}</span></td>
              <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td className="py-3 px-4"><button onClick={() => toggle(u.id, u.is_active)} className="text-kosora-600 text-sm hover:underline">{u.is_active ? 'Deactivate' : 'Activate'}</button></td>
            </tr>
          ))}</tbody>
        </table>
        {users.length === 0 && <p className="text-gray-500 text-center py-8">No users found</p>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Teacher or Admin</h3>
              <button onClick={() => setShowModal(false)}><FiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <select className="w-full px-3 py-2 border rounded-lg" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Full Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <input type="email" required className="w-full px-3 py-2 border rounded-lg" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <input type="password" required className="w-full px-3 py-2 border rounded-lg" placeholder="Password (min 6 chars)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 bg-kosora-600 text-white py-2 rounded-lg hover:bg-kosora-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
