import React from 'react';
import { Navigate } from 'react-router-dom';
import { useParticipantAuth } from '../context/ParticipantAuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ProtectedParticipantRouteProps {
  children: React.ReactNode;
}

export const ProtectedParticipantRoute: React.FC<ProtectedParticipantRouteProps> = ({ children }) => {
  const { session, loading: participantLoading } = useParticipantAuth();
  const { user, role, isAdmin, isJury, isJudge, loading: adminLoading } = useAdminAuth();

  if (participantLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  // If authenticated as admin, jury, or judge, block access to participant portal
  if (user) {
    if (isAdmin || role === 'admin' || role === 'superadmin' || role === 'coordinator') {
      return <Navigate to="/admin" replace />;
    }
    if (isJury || isJudge || role === 'jury' || role === 'judge') {
      return <Navigate to="/jury" replace />;
    }
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
