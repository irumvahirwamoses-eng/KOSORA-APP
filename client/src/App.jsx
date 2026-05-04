import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { roleToPath } from './utils/role';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/Layout';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import Schools from './pages/super-admin/Schools';
import Analytics from './pages/super-admin/Analytics';
import Settings from './pages/super-admin/Settings';
import Profile from './pages/super-admin/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import ClassManagement from './pages/admin/ClassManagement';
import StudentManagement from './pages/admin/StudentManagement';
import ClassReportCards from './pages/admin/ClassReportCards';
import UserManagement from './pages/admin/UserManagement';
import TeacherDashboard from './pages/teacher/Dashboard';
import Materials from './pages/teacher/Materials';
import Exams from './pages/teacher/Exams';
import ExamGenerator from './pages/teacher/ExamGenerator';
import ExamEditor from './pages/teacher/ExamEditor';
import Scanning from './pages/teacher/Scanning';
import Results from './pages/teacher/Results';
import StudentDashboard from './pages/student/Dashboard';
import StudentResults from './pages/student/Results';

const Spinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, role } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to={`/${roleToPath(role)}/dashboard`} replace />;
  return children;
};

function App() {
  const { user, loading, role } = useAuth();

  if (loading) return <Spinner />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={`/${roleToPath(role)}/dashboard`} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${roleToPath(role)}/dashboard`} replace /> : <Register />} />

      <Route path="/super-admin/*" element={
        <ProtectedRoute allowedRoles={['super_admin']}>
          <Layout role="super_admin">
            <Routes>
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="schools" element={<Schools />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout role="admin">
            <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="classes" element={<ClassManagement />} />
            <Route path="students" element={<StudentManagement />} />
              <Route path="report-cards" element={<ClassReportCards />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/*" element={
        <ProtectedRoute allowedRoles={['teacher']}>
          <Layout role="teacher">
            <Routes>
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="materials" element={<Materials />} />
              <Route path="exams" element={<Exams />} />
              <Route path="exams/generate" element={<ExamGenerator />} />
              <Route path="exams/:id/edit" element={<ExamEditor />} />
              <Route path="scanning" element={<Scanning />} />
              <Route path="results" element={<Results />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/student/*" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout role="student">
            <Routes>
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="results" element={<StudentResults />} />
              <Route path="profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={user ? `/${roleToPath(role)}/dashboard` : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
