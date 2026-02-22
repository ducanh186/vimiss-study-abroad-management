

import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, NavLink, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './pages/MainLayout';
import DashboardPage from './pages/DashboardPage';
import CasesPage from './pages/CasesPage';
import CategoriesPage from './pages/CategoriesPage';
import AboutPage from './pages/AboutPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LawyersPage from './pages/LawyersPage';
import PersonsPage from './pages/PersonsPage';
import QuestionsPage from './pages/QuestionsPage';
import MyQuestionsPage from './pages/MyQuestionsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import ReportsPage from './pages/ReportsPage';
import DocumentsTestPage from './pages/DocumentsTestPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import ApprovalsQueuePage from './pages/ApprovalsQueuePage';

const Logo = ({ className = 'h-6 w-6', color = '#0077B6' }) => (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill={color} d="M24.2,2.3c-0.2,0-0.4,0-0.5,0c-0.3,0-0.5,0.1-0.8,0.2c-11.4,2.6-18.1,13.7-15.5,25.1c2,9,9.6,15.7,18.5,16.2c0.2,0,0.3,0,0.5,0c11.8-0.6,21.3-10.4,21.3-22.3C47.6,11.8,37.2,2.4,24.2,2.3z M24,43.3C14.7,43.3,7,35.5,7,26.3c0-8.2,5.9-15.1,13.9-16.5l15.8,15.8C35.6,33.5,29.9,34.2,24,43.3z M30.9,23.3L15.1,7.5c1.4-0.6,3-1,4.6-1.1c9.4-0.5,17.2,6.8,17.2,16.2C36.9,22.8,32,23.1,30.9,23.3z"/>
    </svg>
);


const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-blue-100 shadow-sm">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
        <Logo />
        <span className="text-accent">VIM</span><span className="text-primary">ISS</span>
      </Link>
      <nav className="hidden md:flex items-center space-x-8">
        <NavLink to="/" className={({ isActive }) => `text-secondary hover:text-accent transition-colors ${isActive ? 'text-accent font-semibold' : ''}`}>Giới thiệu</NavLink>
      </nav>
      <div className="flex items-center gap-2">
        <Link to="/login" className="px-4 py-2 rounded-lg text-accent bg-white border border-accent hover:bg-blue-50 transition-colors duration-300 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-px">
          Đăng nhập
        </Link>
        <Link to="/register" className="px-4 py-2 rounded-lg text-white bg-accent hover:bg-accent-hover transition-colors duration-300 font-semibold shadow-sm hover:shadow-md transform hover:-translate-y-px">
          Đăng ký
        </Link>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="bg-accent text-blue-100">
    <div className="container mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
        <div className="mb-6 lg:mb-0 col-span-1 md:col-span-2 lg:col-span-1">
          <Link to="/" className="flex items-center gap-3 text-xl font-bold text-white">
            <Logo className="h-8 w-8" color="#FFFFFF" />
            <span>VIMISS</span>
          </Link>
          <p className="mt-4">Hệ thống quản lý du học Việt Nam</p>
          <p className="mt-1 text-xs text-blue-200">Vietnam International Study System</p>
        </div>
        <div>
          <h3 className="font-semibold text-white uppercase tracking-wider mb-4">Dịch vụ</h3>
          <p className="mb-1">Quản lý hồ sơ du học</p>
          <p className="mb-1">Tư vấn chương trình</p>
          <p>Hỗ trợ sinh viên</p>
        </div>
        <div>
          <h3 className="font-semibold text-white uppercase tracking-wider mb-4">Hệ thống</h3>
          <p className="mb-1">Quản lý sinh viên</p>
          <p className="mb-1">Quản lý cố vấn</p>
          <p>Báo cáo &amp; thống kê</p>
        </div>
        <div>
          <h3 className="font-semibold text-white uppercase tracking-wider mb-4">Liên hệ</h3>
          <p className="mb-1">Email: support@vimiss.edu.vn</p>
          <p className="mb-1">Hotline: 1900 xxxx</p>
          <p>Website: vimiss.edu.vn</p>
        </div>
      </div>
      <div className="mt-10 pt-8 border-t border-blue-500 text-center text-sm text-blue-200">
        <p>&copy; {new Date().getFullYear()} VIMISS. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-grow">
      <Outlet />
    </main>
    <Footer />
  </div>
);


function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<AboutPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          
          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="applications/:applicationId" element={<ApplicationDetailPage />} />
            <Route path="approvals" element={
                <ProtectedRoute allowedRoles={['admin', 'director', 'reviewer']}>
                    <ApprovalsQueuePage />
                </ProtectedRoute>
            } />
            <Route path="cases" element={<Navigate to="/app/applications" replace />} />
            <Route path="cases/:caseId" element={<Navigate to="/app/applications" replace />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="categories/:categoryId" element={<CategoriesPage />} />
            <Route path="persons" element={<Navigate to="/app/applications" replace />} />
            <Route path="persons/:personId" element={<Navigate to="/app/applications" replace />} />
            <Route path="mentors" element={<LawyersPage />} />
            <Route path="mentors/:lawyerId" element={<LawyersPage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="questions/:questionId" element={<QuestionsPage />} />
            <Route path="my-questions" element={<MyQuestionsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="appointments/:appointmentId" element={<AppointmentsPage />} />
            <Route path="my-appointments" element={<MyAppointmentsPage />} />
            <Route path="documents-test/:applicationId" element={<DocumentsTestPage />} />
            <Route path="reports" element={
                <ProtectedRoute allowedRoles={['admin', 'director']}>
                    <ReportsPage />
                </ProtectedRoute>
            } />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
