import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { User, AuthState } from '../domain/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nutriapp_user_id';

const mapProfile = (
  profile: { 
    id: string; 
    name: string; 
    role: string; 
    clinic_id: string | null; 
    phone: string | null;
    cpf: string | null;
    clinic?: { name: string } | null;
  },
  email: string,
): User => ({
  id: profile.id,
  name: profile.name,
  email,
  phone: profile.phone,
  cpf: profile.cpf,
  role: profile.role as User['role'],
  clinicId: profile.clinic_id,
  clinicName: profile.clinic?.name,
});

const fetchUser = async (userId: string, email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, clinic_id, phone, cpf, clinic:clinics(name)')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return mapProfile(data, email);
};

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const updateSession = async (session: any) => {
    if (session?.user) {
      const user = await fetchUser(session.user.id, session.user.email ?? '');
      if (user) {
        await AsyncStorage.setItem(STORAGE_KEY, user.id);
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      updateSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await updateSession(session);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(STORAGE_KEY);
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return { ...state, login, logout, refreshUser };
};
