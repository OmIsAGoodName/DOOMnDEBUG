import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '../lib/supabase';
import { config } from '../config';

export interface AuthContextType {
  user: User | { id: string; email?: string } | null;
  session: Session | null;
  demoMode: boolean;
  loading: boolean;
  signUp: (email: string, pass: string, displayName: string, accountType?: string) => Promise<void>;
  signIn: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | { id: string; email?: string } | null>(null);
  const [demoMode, setDemoModeState] = useState<boolean>(config.isDemoMode());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (demoMode) {
      setUser({ id: 'demo', email: 'demo@voxfable.local' });
      setLoading(false);
      return;
    }

    const sb = getSupabaseClient();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [demoMode]);

  const enterDemoMode = () => {
    config.setDemoMode(true);
    setDemoModeState(true);
    setUser({ id: 'demo', email: 'demo@voxfable.local' });
    setSession(null);
  };

  const signIn = async (email: string, pass: string) => {
    config.setDemoMode(false);
    setDemoModeState(false);
    const sb = getSupabaseClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signUp = async (email: string, pass: string, displayName: string, accountType = 'parent') => {
    config.setDemoMode(false);
    setDemoModeState(false);
    const sb = getSupabaseClient();
    if (!sb) throw new Error('Supabase client not configured');
    const { error } = await sb.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName,
          account_type: accountType,
        },
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    config.setDemoMode(false);
    setDemoModeState(false);
    const sb = getSupabaseClient();
    if (sb) {
      await sb.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        demoMode,
        loading,
        signUp,
        signIn,
        signOut,
        enterDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
