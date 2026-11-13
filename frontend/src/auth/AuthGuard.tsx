import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export interface AuthContextType {
  user: { id: string; email?: string } | null;
  demoMode: boolean;
}

// In stub mode, let demo mode be enabled by default so routes are accessible
export function useAuth() {
  const isDemo = localStorage.getItem('voxfable_demo_mode') !== 'false';
  return {
    user: isDemo ? { id: 'demo', email: 'demo@voxfable.local' } : null,
    demoMode: isDemo,
    loading: false,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
    enterDemoMode: () => {
      localStorage.setItem('voxfable_demo_mode', 'true');
    },
  };
}

export function AuthGuard() {
  const { user, demoMode, loading } = useAuth();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  if (!user && !demoMode) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default AuthGuard;

