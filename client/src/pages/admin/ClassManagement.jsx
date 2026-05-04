import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showClassModal, setShowClassModal] = useState(false);
  const [editClass, setEditClass] = useState(null);
  const [classForm, setClassForm] = useState({ name: '', gradeLevel: '', teacherId: '', academicYear: '2025-2026' });

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '' });

  const [showAssignModal, setShowAssignModal] = useState(null);
  const [assignForm, setAssignForm] = useState({ subjectId: '', teacherId: '' });

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const [c, s, u] = await Promise.all([
        api.get('/api/school/classes'),
        api.get('/api/school/subjects'),
        api.get('/api/school/users?role=teacher'),
      ]);
      setClasses(c.data.classes || []);
      setSubjects(s.data.subjects || []);
      setTeachers(u.data.users || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/school/classes', classForm);
      toast.success('Class created');
      setShowClassModal(false);
      setEditClass(null);
      setClassForm({ name: '', gradeLevel: '', teacherId: '', academicYear: '2025-2026' });
      fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleUpdateClass = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/school/classes/${editClass.id}`, classForm);
      toast.success('Class updated');
      setShowClassModal(false);
      setEditClass(null);
      setClassForm({ name: '', gradeLevel: '', teacherId: '', academicYear: '2025-2026' });
      fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleDeleteClass = async (id, name) => {
    if (!window.confirm(`Delete class "${name}"?`)) return;
    try { await api.delete(`/api/school/classes/${id}`); toast.success('Class deleted'); fetch(); }
    catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/school/subjects', subjectForm);
      toast.success('Subject created');
      setShowSubjectModal(false);
      setSubjectForm({ name: '', code: '' });
      fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/school/class-subjects', { classId: showAssignModal, subjectId: assignForm.subjectId, teacherId: assignForm.teacherId || null });
      toast.success('Subject assigned');
      setShowAssignModal(null);
      setAssignForm({ subjectId: '', teacherId: '' });
      fetch();
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Classes & Subjects</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Classes</h3>
            <button onClick={() => setShowClassModal(true)} className="btn btn-primary text-sm flex items-center gap-1"><FiPlus className="w-4 h-4" /> Add Class</button>
          </div>
          {classes.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">No classes</p> : (
            <div className="space-y-2">
              {classes.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-gray-500">Grade {c.grade_level} {c.teacher_name ? `• ${c.teacher_name}` : ''} • {c.academic_year}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditClass(c); setClassForm({ name: c.name, gradeLevel: c.grade_level, teacherId: c.teacher_id || '', academicYear: c.academic_year || '' }); setShowClassModal(true); }} className="p-1.5 rounded hover:bg-gray-200 text-blue-600"><FiEdit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteClass(c.id, c.name)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><FiTrash2 className="w-4 h-4" /></button>
                    <button onClick={() => setShowAssignModal(c.id)} className="p-1.5 rounded hover:bg-gray-200 text-green-600" title="Assign Subject"><FiPlus className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Subjects</h3>
            <button onClick={() => setShowSubjectModal(true)} className="btn btn-primary text-sm flex items-center gap-1"><FiPlus className="w-4 h-4" /> Add Subject</button>
          </div>
          {subjects.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">No subjects</p> : (
            <div className="space-y-2">
              {subjects.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.code}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editClass ? 'Edit Class' : 'Add Class'}</h3>
              <button onClick={() => { setShowClassModal(false); setEditClass(null); }}><FiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={editClass ? handleUpdateClass : handleCreateClass} className="space-y-3">
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Class Name (e.g. Form 4A)" value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} />
              <input type="number" required className="w-full px-3 py-2 border rounded-lg" placeholder="Grade Level (e.g. 10)" value={classForm.gradeLevel} onChange={e => setClassForm({ ...classForm, gradeLevel: e.target.value })} />
              <select className="w-full px-3 py-2 border rounded-lg" value={classForm.teacherId} onChange={e => setClassForm({ ...classForm, teacherId: e.target.value })}>
                <option value="">Assign Teacher (optional)</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <input className="w-full px-3 py-2 border rounded-lg" placeholder="Academic Year" value={classForm.academicYear} onChange={e => setClassForm({ ...classForm, academicYear: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowClassModal(false); setEditClass(null); setClassForm({ name: '', gradeLevel: '', teacherId: '', academicYear: '2025-2026' }); }} className="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 bg-kosora-600 text-white py-2 rounded-lg hover:bg-kosora-700">{editClass ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Subject</h3>
              <button onClick={() => setShowSubjectModal(false)}><FiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Subject Name (e.g. Mathematics)" value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} />
              <input required className="w-full px-3 py-2 border rounded-lg" placeholder="Code (e.g. MATH)" value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowSubjectModal(false)} className="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 bg-kosora-600 text-white py-2 rounded-lg hover:bg-kosora-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Assign Subject to Class</h3>
              <button onClick={() => setShowAssignModal(null)}><FiX className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAssignSubject} className="space-y-3">
              <select required className="w-full px-3 py-2 border rounded-lg" value={assignForm.subjectId} onChange={e => setAssignForm({ ...assignForm, subjectId: e.target.value })}>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select className="w-full px-3 py-2 border rounded-lg" value={assignForm.teacherId} onChange={e => setAssignForm({ ...assignForm, teacherId: e.target.value })}>
                <option value="">Assign Teacher (optional)</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAssignModal(null)} className="flex-1 bg-gray-100 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
                <button type="submit" className="flex-1 bg-kosora-600 text-white py-2 rounded-lg hover:bg-kosora-700">Assign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
