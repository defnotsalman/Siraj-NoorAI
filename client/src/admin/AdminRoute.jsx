import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AdminLayout from './AdminLayout';
import { AdminThemeProvider } from './context/AdminThemeContext';

const AdminRoute = () => {
  const { user, profile, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Must be logged in AND have is_admin = true
  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminThemeProvider>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminThemeProvider>
  );
};

export default AdminRoute;
