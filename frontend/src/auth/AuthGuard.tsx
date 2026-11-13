import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';

export function AuthGuard() {
  const { user, demoMode, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-slate-500 font-medium">
        Loading VoxFable session...
      </div>
    );
  }

  if (!user && !demoMode) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default AuthGuard;
