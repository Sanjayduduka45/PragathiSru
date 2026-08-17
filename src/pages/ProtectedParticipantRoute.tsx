import React from 'react';
import { Navigate } from 'react-router-dom';
import { useParticipantAuth } from '../context/ParticipantAuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';

interface ProtectedParticipantRouteProps {
  children: React.ReactNode;
}

export const ProtectedParticipantRoute: React.FC<ProtectedParticipantRouteProps> = ({ children }) => {
  const { session, loading: participantLoading } = useParticipantAuth();
  const { user, isAdmin, isJudge, loading: adminLoading } = useAdminAuth();

  if (participantLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  // If authenticated as admin or judge, block access to participant portal
  if (user) {
    if (isAdmin) return <Navigate to="/admin" replace />;
    if (isJudge) return <Navigate to="/judge" replace />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
