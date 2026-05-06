import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedApp, setSelectedApp] = useState(null);
  const [notes, setNotes] = useState('');
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    code: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    adminPhone: '',
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/applications${filter ? `?status=${filter}` : ''}`);
      setApplications(res.data.applications);
    } catch {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/applications/${id}/status`, { status, notes: notes || null });
      toast.success(`Application ${status}`);
      setSelectedApp(null);
      setNotes('');
      fetchApplications();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const deleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      await api.delete(`/api/applications/${id}`);
      toast.success('Application deleted');
      setSelectedApp(null);
      fetchApplications();
    } catch {
      toast.error('Failed to delete application');
    }
  };

  const registerSchool = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/schools', {
        name: schoolForm.name || selectedApp.school_name,
        code: schoolForm.code,
        adminName: schoolForm.adminName || selectedApp.contact_person,
        adminEmail: schoolForm.adminEmail || selectedApp.email,
        adminPassword: schoolForm.adminPassword,
        adminPhone: schoolForm.adminPhone || selectedApp.phone,
      });
      await api.patch(`/api/applications/${selectedApp.id}/status`, { status: 'registered' });
      toast.success('School registered successfully');
      setSelectedApp(null);
      setSchoolForm({ name: '', code: '', adminName: '', adminEmail: '', adminPassword: '', adminPhone: '' });
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to register school');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      registered: 'bg-green-100 text-green-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Applications</h1>
          <p className="text-gray-500 mt-1">Review and manage school registration requests</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="registered">Registered</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kosora-600"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`bg-white rounded-xl border cursor-pointer hover:shadow-md transition p-5 ${
                  selectedApp?.id === app.id ? 'border-kosora-500 ring-2 ring-kosora-100' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.school_name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{app.contact_person} • {app.email}</p>
                    <p className="text-sm text-gray-500">{app.phone} • {app.location || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(app.status)}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {app.message && (
                  <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{app.message}</p>
                )}
                <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                  <span>Type: {app.school_type}</span>
                  {app.student_count && <span>Students: {app.student_count}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedApp && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 h-fit">
            <h3 className="font-semibold text-gray-900 mb-4">Application Details</h3>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">School:</span> <span className="font-medium">{selectedApp.school_name}</span></div>
              <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{selectedApp.contact_person}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{selectedApp.email}</span></div>
              <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{selectedApp.phone}</span></div>
              <div><span className="text-gray-500">Location:</span> <span className="font-medium">{selectedApp.location || 'N/A'}</span></div>
              <div><span className="text-gray-500">Type:</span> <span className="font-medium capitalize">{selectedApp.school_type}</span></div>
              <div><span className="text-gray-500">Students:</span> <span className="font-medium">{selectedApp.student_count || 'N/A'}</span></div>
              {selectedApp.message && <div><span className="text-gray-500">Message:</span> <p className="mt-1">{selectedApp.message}</p></div>}
              {selectedApp.notes && <div><span className="text-gray-500">Notes:</span> <p className="mt-1">{selectedApp.notes}</p></div>}
            </div>

            <div className="mt-6 space-y-3">
              <textarea
                placeholder="Add notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />

              {selectedApp.status === 'pending' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateStatus(selectedApp.id, 'approved')}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(selectedApp.id, 'rejected')}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}

              {(selectedApp.status === 'pending' || selectedApp.status === 'approved') && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Register as School</h4>
                  <form onSubmit={registerSchool} className="space-y-3">
                    <input
                      type="text"
                      placeholder="School code *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={schoolForm.code}
                      onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                      required
                    />
                    <input
                      type="password"
                      placeholder="Admin password *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={schoolForm.adminPassword}
                      onChange={(e) => setSchoolForm({ ...schoolForm, adminPassword: e.target.value })}
                      required
                    />
                    <button
                      type="submit"
                      className="w-full px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                    >
                      Create School & Register
                    </button>
                  </form>
                </div>
              )}

              <button
                onClick={() => deleteApplication(selectedApp.id)}
                className="w-full px-3 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                Delete Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
