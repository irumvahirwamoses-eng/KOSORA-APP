import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiBookOpen, FiCamera, FiBarChart2, FiUsers, FiAward, FiTrendingUp, FiShield, FiArrowRight
} from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate(`/${user.role.replace(/_/g, '-')}/dashboard`);
    } else {
      navigate('/apply');
    }
  };

  const features = [
    { icon: FiBookOpen, title: 'Exam Management', desc: 'Create, manage, and organize exams with AI-powered question generation from learning materials.' },
    { icon: FiCamera, title: 'OMR Scanning', desc: 'Scan answer sheets automatically using computer vision and Tesseract OCR for instant grading.' },
    { icon: FiBarChart2, title: 'Analytics & Reports', desc: 'Track student performance, generate report cards, and get insights with real-time analytics.' },
    { icon: FiUsers, title: 'Multi-Tenant System', desc: 'Support for multiple schools with isolated data, role-based access, and subscription management.' },
    { icon: FiAward, title: 'Smart Grading', desc: 'Automated grading system with customizable grading scales, percentages, and performance tracking.' },
    { icon: FiShield, title: 'Secure & Reliable', desc: 'JWT authentication, encrypted passwords, and role-based authorization to keep data safe.' },
  ];

  const problems = [
    { problem: 'Manual exam grading takes days', solution: 'OMR scanning grades hundreds of sheets in minutes' },
    { problem: 'No centralized exam management', solution: 'All exams, questions, and results in one platform' },
    { problem: 'Report cards take weeks to prepare', solution: 'Generate report cards instantly with one click' },
    { problem: 'No performance tracking', solution: 'Real-time analytics and student performance dashboards' },
    { problem: 'Paper records get lost', solution: 'Digital storage with secure cloud backup' },
    { problem: 'Difficult to create quality exams', solution: 'AI generates exam questions from uploaded materials' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-kosora-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">K</span>
              </div>
              <span className="font-bold text-xl text-gray-900">Kosora</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <button
                  onClick={() => navigate(`/${user.role.replace(/_/g, '-')}/dashboard`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-kosora-600"
                >
                  Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-kosora-600">
                    Sign In
                  </Link>
                  <Link to="/apply" className="px-4 py-2 bg-kosora-600 text-white text-sm font-medium rounded-lg hover:bg-kosora-700 transition">
                    Apply Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-kosora-100 text-kosora-700 rounded-full text-sm font-medium mb-6">
            <FiTrendingUp className="w-4 h-4 mr-2" />
            Smart School Examination System
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Transform How Schools<br />
            <span className="text-kosora-600">Manage Examinations</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Kosora is an all-in-one school examination and OMR scanning platform. Create exams, scan answer sheets, 
            generate report cards, and track student performance — all from one system.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-kosora-600 text-white font-medium rounded-xl hover:bg-kosora-700 transition flex items-center"
            >
              {user ? 'Go to Dashboard' : 'Apply for Your School'}
              <FiArrowRight className="ml-2 w-5 h-5" />
            </button>
            {!user && (
              <Link to="/login" className="px-8 py-4 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:border-kosora-600 hover:text-kosora-600 transition">
                Sign In to Demo
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Problems We Solve</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Schools face real challenges in exam management. Here's how Kosora fixes them.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {problems.map((item, i) => (
              <div key={i} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 font-bold text-sm">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 line-through">{item.problem}</p>
                    <p className="mt-2 text-sm font-medium text-green-600 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2 text-xs">✓</span>
                      {item.solution}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Powerful Features</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Everything your school needs for complete examination management.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="p-8 bg-white rounded-2xl shadow-sm hover:shadow-lg transition border border-gray-100">
                  <div className="w-14 h-14 bg-kosora-100 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-kosora-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-kosora-600">50+</p>
              <p className="mt-2 text-gray-600">Schools Registered</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-kosora-600">10K+</p>
              <p className="mt-2 text-gray-600">Students Managed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-kosora-600">500+</p>
              <p className="mt-2 text-gray-600">Exams Processed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-kosora-600">95%</p>
              <p className="mt-2 text-gray-600">Time Saved on Grading</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-kosora-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">Ready to Transform Your School?</h2>
          <p className="mt-4 text-lg text-kosora-100 max-w-2xl mx-auto">
            Join schools already using Kosora to streamline their examination process. 
            Apply now and get started in minutes.
          </p>
          <button
            onClick={handleGetStarted}
            className="mt-8 px-8 py-4 bg-white text-kosora-600 font-medium rounded-xl hover:bg-gray-100 transition inline-flex items-center"
          >
            {user ? 'Go to Dashboard' : 'Apply for Your School'}
            <FiArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </section>

      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-9 h-9 bg-kosora-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="font-bold text-xl text-white">Kosora</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Kosora. Smart School Examination & OMR System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
