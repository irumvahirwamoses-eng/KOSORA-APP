import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiBriefcase, FiUsers, FiBarChart2, FiDollarSign } from 'react-icons/fi';

const SuperAdminDashboard = () => {
  const [schools, setSchools] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', code: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/api/schools?limit=20');
      setSchools(res.data.schools || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/schools', form);
      toast.success('School created successfully');
      setShowModal(false);
      setForm({ name: '', code: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  const totalUsers = schools.reduce((a, b) => a + (parseInt(b.user_count) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Super Admin Dashboard</h2>
        <button onClick={() => setShowModal(true)} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2">
          <FiPlus className="w-4 h-4" /> Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FiBriefcase, label: 'Total Schools', value: schools.length, color: 'blue' },
          { icon: FiUsers, label: 'Total Users', value: totalUsers, color: 'green' },
          { icon: FiBarChart2, label: 'Active', value: schools.filter(s => s.subscription_status === 'active').length, color: 'purple' },
          { icon: FiDollarSign, label: 'Trial', value: schools.filter(s => s.subscription_status === 'trial').length, color: 'orange' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border p-6 flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${s.color}-50 text-${s.color}-600`}><s.icon className="w-6 h-6" /></div>
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Registered Schools</h3>
        {schools.length === 0 ? (
          <div className="text-center py-8"><p className="text-gray-500 mb-4">No schools yet</p>
            <button onClick={() => setShowModal(true)} className="bg-kosora-600 text-white px-4 py-2 rounded-lg">Register First School</button>
          </div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b"><th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Name</th><th className="text-left py-2 px-3 text-sm text-gray-600">Code</th><th className="text-left py-2 px-3 text-sm text-gray-600">Status</th><th className="text-left py-2 px-3 text-sm text-gray-600">Users</th></tr></thead>
            <tbody>{schools.map(s => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">{s.name}</td>
                <td className="py-2 px-3 text-sm">{s.code}</td>
                <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded-full text-xs ${s.subscription_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{s.subscription_status}</span></td>
                <td className="py-2 px-3">{s.user_count || 0}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Register New School</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="School Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="School Code (e.g. SCH001)" value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} />
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Admin Name" value={form.adminName} onChange={(e) => setForm({...form, adminName: e.target.value})} />
              <input type="email" required className="w-full px-3 py-2 border rounded-lg" placeholder="Admin Email" value={form.adminEmail} onChange={(e) => setForm({...form, adminEmail: e.target.value})} />
              <input type="password" required className="w-full px-3 py-2 border rounded-lg" placeholder="Admin Password" value={form.adminPassword} onChange={(e) => setForm({...form, adminPassword: e.target.value})} />
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Admin Phone" value={form.adminPhone} onChange={(e) => setForm({...form, adminPhone: e.target.value})} />
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

export default SuperAdminDashboard;
