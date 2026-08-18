import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, role, isAdmin, loading } = useAdminAuth();
  const location = useLocation();

  // Neutral loading screen while session & role are resolving.
  // NEVER mount the AdminLayout or Admin Dashboard during loading.
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role verification: ensure user is admin
  if (!isAdmin) {
    if (role === 'participant') {
      return <Navigate to="/participant" replace />;
    }
    if (role === 'jury' || role === 'judge') {
      return <Navigate to="/jury" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
