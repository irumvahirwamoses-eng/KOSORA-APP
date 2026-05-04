import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiUpload, FiTrash2 } from 'react-icons/fi';

const Materials = () => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ title: '', description: '', subjectId: '', classId: '', topic: '', file: null });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const [m, s, c] = await Promise.all([api.get('/api/materials?limit=100'), api.get('/api/school/subjects'), api.get('/api/school/classes')]);
      setMaterials(m.data.materials || []);
      setSubjects(s.data.subjects || []);
      setClasses(c.data.classes || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = materials.filter(m => !search || m.title?.toLowerCase().includes(search.toLowerCase()) || m.topic?.toLowerCase().includes(search.toLowerCase()));

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file) return toast.error('Select a file');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', form.file);
    fd.append('title', form.title);
    fd.append('description', form.description);
    fd.append('subjectId', form.subjectId);
    fd.append('classId', form.classId);
    fd.append('topic', form.topic);
    try {
      await api.post('/api/materials', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Uploaded');
      setShowModal(false);
      setForm({ title: '', description: '', subjectId: '', classId: '', topic: '', file: null });
      fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await api.delete(`/api/materials/${id}`); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Learning Materials</h2>
        <button onClick={() => setShowModal(true)} className="bg-kosora-600 text-white px-4 py-2 rounded-lg hover:bg-kosora-700 flex items-center gap-2">
          <FiUpload className="w-4 h-4" /> Upload
        </button>
      </div>
      <input className="px-3 py-2 border rounded-lg w-full max-w-md" placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md">
            <div className="flex justify-between items-start">
              <div><h3 className="font-semibold">{m.title}</h3><p className="text-sm text-gray-500 mt-1">{m.subject_name}</p></div>
              <span className={`px-2 py-0.5 rounded-full text-xs uppercase font-medium ${m.file_type === 'pdf' ? 'bg-red-100 text-red-800' : m.file_type === 'docx' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{m.file_type}</span>
            </div>
            {m.topic && <p className="text-sm text-gray-600 mt-2">Topic: {m.topic}</p>}
            <p className="text-xs text-gray-400 mt-2">{new Date(m.created_at).toLocaleDateString()}</p>
            <button onClick={() => handleDelete(m.id)} className="mt-3 text-red-600 text-sm hover:underline flex items-center gap-1"><FiTrash2 className="w-3 h-3" /> Delete</button>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-gray-500 text-center py-8">No materials found</p>}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-4">Upload Material</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Title" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} />
              <textarea className="w-full px-3 py-2 border rounded-lg" placeholder="Description" rows={2} value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <select required className="px-3 py-2 border rounded-lg" value={form.subjectId} onChange={(e) => setForm({...form, subjectId: e.target.value})}><option value="">Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                <select className="px-3 py-2 border rounded-lg" value={form.classId} onChange={(e) => setForm({...form, classId: e.target.value})}><option value="">All Classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Topic" value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} />
              <input type="file" accept=".pdf,.docx,.txt" required className="w-full px-3 py-2 border rounded-lg" onChange={(e) => setForm({...form, file: e.target.files[0]})} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 py-2 rounded-lg">Cancel</button>
                <button type="submit" disabled={uploading} className="flex-1 bg-kosora-600 text-white py-2 rounded-lg disabled:opacity-50">{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Materials;
