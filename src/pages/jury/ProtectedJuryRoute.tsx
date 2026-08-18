import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useParticipantAuth } from '../../context/ParticipantAuthContext';

interface ProtectedJuryRouteProps {
  children: React.ReactNode;
}

export const ProtectedJuryRoute: React.FC<ProtectedJuryRouteProps> = ({ children }) => {
  const { user, role, isAdmin, isJury, isJudge, loading: adminLoading } = useAdminAuth();
  const { session: participantSession, loading: participantLoading } = useParticipantAuth();
  const location = useLocation();

  if (adminLoading || participantLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  // If a participant tries to access /jury, redirect to /participant
  if (participantSession && !user) {
    return <Navigate to="/participant" replace />;
  }

  // Not authenticated -> redirect to common login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated as Admin, redirect to /admin
  if (isAdmin || role === 'admin' || role === 'superadmin' || role === 'coordinator') {
    return <Navigate to="/admin" replace />;
  }

  // If authenticated as Participant, redirect to /participant
  if (role === 'participant') {
    return <Navigate to="/participant" replace />;
  }

  // If user account is suspended or inactive
  if (role === 'inactive') {
    return <Navigate to="/login" replace />;
  }

  // Must have role = 'jury' or 'judge'
  if (!isJury && !isJudge && role !== 'jury' && role !== 'judge') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
