import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiX, FiEye } from 'react-icons/fi';

const Schools = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editSchool, setEditSchool] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', code: '', subscription_status: '' });
  const [viewSchool, setViewSchool] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  useEffect(() => { fetchSchools(); }, [page]);

  const fetchSchools = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/schools?page=${page}&limit=20`);
      setSchools(res.data.schools || []);
      setPagination(res.data.pagination || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete school "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/schools/${id}`);
      toast.success('School deleted');
      fetchSchools();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to delete'); }
  };

  const openEdit = (school) => {
    setEditSchool(school);
    setEditForm({ name: school.name, code: school.code, subscription_status: school.subscription_status });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/schools/${editSchool.id}`, editForm);
      toast.success('School updated');
      setEditSchool(null);
      fetchSchools();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to update'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Schools</h2>
        <span className="text-sm text-gray-500">{pagination.total} schools total</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Code</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Users</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Created</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {schools.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-500">No schools found</td></tr>
            ) : (
              schools.map(s => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{s.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{s.code}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      s.subscription_status === 'active' ? 'badge-success' : s.subscription_status === 'trial' ? 'badge-warning' : 'badge-danger'
                    }`}>{s.subscription_status}</span>
                  </td>
                  <td className="py-3 px-4">{s.user_count || 0}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setViewSchool(s)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600" title="View"><FiEye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-200 text-blue-600" title="Edit"><FiEdit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id, s.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600" title="Delete"><FiTrash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50">Previous</button>
            <span className="text-sm text-gray-600">Page {page} of {pagination.pages}</span>
            <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-lg bg-gray-100 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>

      {viewSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">School Details</h3>
              <button onClick={() => setViewSchool(null)}><FiX className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{viewSchool.name}</p></div>
                <div><p className="text-xs text-gray-500">Code</p><p className="font-medium">{viewSchool.code}</p></div>
                <div><p className="text-xs text-gray-500">Status</p><p className="font-medium capitalize">{viewSchool.subscription_status}</p></div>
                <div><p className="text-xs text-gray-500">Users</p><p className="font-medium">{viewSchool.user_count || 0}</p></div>
                <div><p className="text-xs text-gray-500">Classes</p><p className="font-medium">{viewSchool.class_count || 0}</p></div>
                <div><p className="text-xs text-gray-500">Created</p><p className="font-medium">{new Date(viewSchool.created_at).toLocaleDateString()}</p></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editSchool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Edit School</h3>
              <button onClick={() => setEditSchool(null)}><FiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required className="w-full px-3 py-2 border rounded-lg" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input required className="w-full px-3 py-2 border rounded-lg" value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Status</label>
                <select className="w-full px-3 py-2 border rounded-lg" value={editForm.subscription_status} onChange={e => setEditForm({ ...editForm, subscription_status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditSchool(null)} className="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 bg-kosora-600 text-white py-2 rounded-lg hover:bg-kosora-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schools;
