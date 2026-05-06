import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { User, AuthState } from '../domain/auth';

const mapSupabaseUser = async (supabaseUserId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role')
    .eq('id', supabaseUserId)
    .single();

  if (error || !data) return null;

  const { data: sessionData } = await supabase.auth.getUser();
  const email = sessionData?.user?.email ?? '';

  return {
    id: data.id,
    name: data.name,
    email,
    role: data.role,
  };
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = await mapSupabaseUser(session.user.id);
        setState({ user, isAuthenticated: !!user, isLoading: false });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = await mapSupabaseUser(session.user.id);
        setState({ user, isAuthenticated: !!user, isLoading: false });
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return { ...state, login, logout };
};
