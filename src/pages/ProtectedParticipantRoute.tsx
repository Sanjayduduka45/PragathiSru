import React from 'react';
import { Navigate } from 'react-router-dom';
import { useParticipantAuth } from '../context/ParticipantAuthContext';

interface ProtectedParticipantRouteProps {
  children: React.ReactNode;
}

export const ProtectedParticipantRoute: React.FC<ProtectedParticipantRouteProps> = ({ children }) => {
  const { session, loading } = useParticipantAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#004182]/20 border-t-[#004182] rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
