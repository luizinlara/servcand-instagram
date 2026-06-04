import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PersonsPage from './pages/PersonsPage';
import CompaniesPage from './pages/CompaniesPage';
import UsersPage from './pages/UsersPage';
import ProfilesPage from './pages/ProfilesPage';
import RegionsPage from './pages/RegionsPage';
import LeadershipPage from './pages/LeadershipPage';
import MissionsPage from './pages/MissionsPage';
import InstagramPage from './pages/InstagramPage';
import SalaryPage from './pages/SalaryPage';
import ParametersPage from './pages/ParametersPage';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const isEmployee = user?.profile?.name === 'EMPLOYEE';

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      
      {!isEmployee && (
        <>
          <Route path="/persons" element={<ProtectedLayout><PersonsPage /></ProtectedLayout>} />
          <Route path="/companies" element={<ProtectedLayout><CompaniesPage /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><UsersPage /></ProtectedLayout>} />
          <Route path="/profiles" element={<ProtectedLayout><ProfilesPage /></ProtectedLayout>} />
          <Route path="/regions" element={<ProtectedLayout><RegionsPage /></ProtectedLayout>} />
          <Route path="/leadership" element={<ProtectedLayout><LeadershipPage /></ProtectedLayout>} />
          <Route path="/missions" element={<ProtectedLayout><MissionsPage /></ProtectedLayout>} />
          <Route path="/instagram" element={<ProtectedLayout><InstagramPage /></ProtectedLayout>} />
          <Route path="/salary" element={<ProtectedLayout><SalaryPage /></ProtectedLayout>} />
          <Route path="/parameters" element={<ProtectedLayout><ParametersPage /></ProtectedLayout>} />
        </>
      )}

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
