import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome, FiFile, FiUsers, FiBarChart2, FiCamera,
  FiUpload, FiSettings, FiLogOut, FiMenu, FiX, FiAward, FiClipboard,
  FiTrendingUp, FiDollarSign, FiBookOpen, FiUserCheck, FiInbox
} from 'react-icons/fi';

const Layout = ({ children, role }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    switch (role) {
      case 'super_admin':
        return [
          { path: '/super-admin/dashboard', icon: FiHome, label: 'Dashboard' },
          { path: '/super-admin/schools', icon: FiBookOpen, label: 'Schools' },
          { path: '/super-admin/applications', icon: FiInbox, label: 'Applications' },
          { path: '/super-admin/analytics', icon: FiBarChart2, label: 'Analytics' },
          { path: '/super-admin/settings', icon: FiSettings, label: 'Settings' },
          { path: '/super-admin/profile', icon: FiUserCheck, label: 'Profile' },
        ];
      case 'admin':
        return [
          { path: '/admin/dashboard', icon: FiHome, label: 'Dashboard' },
          { path: '/admin/classes', icon: FiBookOpen, label: 'Classes' },
          { path: '/admin/students', icon: FiUsers, label: 'Students' },
          { path: '/admin/report-cards', icon: FiAward, label: 'Report Cards' },
          { path: '/admin/users', icon: FiUserCheck, label: 'Users' },
          { path: '/admin/profile', icon: FiUserCheck, label: 'Profile' },
        ];
      case 'teacher':
        return [
          { path: '/teacher/dashboard', icon: FiHome, label: 'Dashboard' },
          { path: '/teacher/materials', icon: FiUpload, label: 'Materials' },
          { path: '/teacher/exams', icon: FiFile, label: 'Exams' },
          { path: '/teacher/exams/generate', icon: FiClipboard, label: 'Create Assessment' },
          { path: '/teacher/scanning', icon: FiCamera, label: 'Scan OMR' },
          { path: '/teacher/results', icon: FiBarChart2, label: 'Results' },
          { path: '/teacher/profile', icon: FiUserCheck, label: 'Profile' },
        ];
      case 'student':
        return [
          { path: '/student/dashboard', icon: FiHome, label: 'Dashboard' },
          { path: '/student/results', icon: FiBarChart2, label: 'My Results' },
          { path: '/student/profile', icon: FiUserCheck, label: 'Profile' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col fixed h-full z-10`}>
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-kosora-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              <span className="font-bold text-lg text-gray-800">Kosora</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
            {sidebarOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive ? 'bg-kosora-50 text-kosora-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-8 h-8 rounded-full bg-kosora-100 flex items-center justify-center flex-shrink-0">
              <span className="text-kosora-700 font-medium text-sm">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ')}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <FiLogOut className="w-5 h-5" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
          </h1>
          <span className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
