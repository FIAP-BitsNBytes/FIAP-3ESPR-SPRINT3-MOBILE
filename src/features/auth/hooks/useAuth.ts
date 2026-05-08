import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { User, AuthState } from '../domain/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateInterceptorUserId } from '@/shared/infrastructure/supabase/interceptor';

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

  // Trava para evitar operações de autenticação concorrentes
  const [isProcessing, setIsProcessing] = useState(false);

  const updateSession = async (session: Session | null) => {
    try {
      if (session?.user) {
        // 1. Primeiro atualiza o interceptor para garantir que o ID esteja nos headers
        updateInterceptorUserId(session.user.id);
        
        // 2. Busca o perfil
        const user = await fetchUser(session.user.id, session.user.email ?? '');
        
        if (user) {
          await AsyncStorage.setItem(STORAGE_KEY, user.id);
          setState({ user, isAuthenticated: true, isLoading: false });
        } else {
          // Caso crítico: Autenticado no Auth mas sem perfil no DB
          console.error('[Auth] Perfil não encontrado para usuário autenticado');
          throw new Error('Perfil incompleto. Entre em contato com o suporte.');
        }
      } else {
        throw new Error('Sem sessão');
      }
    } catch (err) {
      // Limpeza total em caso de qualquer falha
      updateInterceptorUserId(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
      setState({ user: null, isAuthenticated: false, isLoading: false });
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) updateSession(session);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) updateSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await updateSession(session);
  };

  const login = async (email: string, password: string) => {
    if (isProcessing) return; // Bloqueia cliques múltiplos
    
    setIsProcessing(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Tentamos deslogar no servidor, mas o deslogue LOCAL é obrigatório
      await supabase.auth.signOut().catch(e => console.warn('[Auth] SignOut remoto falhou', e));
    } finally {
      updateInterceptorUserId(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
      setState({ user: null, isAuthenticated: false, isLoading: false });
      setIsProcessing(false);
    }
  };

  return { 
    ...state, 
    isLoading: state.isLoading || isProcessing, 
    login, 
    logout, 
    refreshUser 
  };
};
