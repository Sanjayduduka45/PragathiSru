import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useParticipantAuth } from '../../context/ParticipantAuthContext';

interface ProtectedJudgeRouteProps {
  children: React.ReactNode;
}

export const ProtectedJudgeRoute: React.FC<ProtectedJudgeRouteProps> = ({ children }) => {
  const { user, role, isAdmin, isJudge, loading: adminLoading } = useAdminAuth();
  const { session: participantSession, loading: participantLoading } = useParticipantAuth();
  const location = useLocation();

  if (adminLoading || participantLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  // If a participant tries to access /judge, redirect to /participant
  if (participantSession && !user) {
    return <Navigate to="/participant" replace />;
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated as Admin, redirect to /admin
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  // If user account is suspended or inactive
  if (role === 'inactive') {
    return <Navigate to="/login" replace />;
  }

  // Must be judge
  if (!isJudge && role !== 'judge' && role !== 'jury') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
