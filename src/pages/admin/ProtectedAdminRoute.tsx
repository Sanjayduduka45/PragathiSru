import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout } from '../../layouts/AdminLayout';
import { AuthLoadingScreen } from '../../components/admin/AdminSkeleton';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <AdminLayout>
        <AuthLoadingScreen />
      </AdminLayout>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
