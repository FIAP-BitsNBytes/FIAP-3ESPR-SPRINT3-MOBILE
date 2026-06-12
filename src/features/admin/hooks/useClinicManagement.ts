import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { uniqueChannelName } from '@/shared/utils/realtime';

export interface ClinicData {
  id: string;
  name: string;
  phone: string | null;
}

interface UseClinicManagementState {
  clinic: ClinicData | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}

export const useClinicManagement = () => {
  const { user } = useAuthContext();
  const [state, setState] = useState<UseClinicManagementState>({
    clinic: null,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  const fetchClinic = async () => {
    if (!user?.clinicId) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Não foi possível encontrar sua clínica.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Fetch clinic details
    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('id, name, phone')
      .eq('id', user.clinicId)
      .single();

    if (clinicErr) {
      setState(prev => ({ ...prev, isLoading: false, error: clinicErr.message }));
      return;
    }

    setState({
      clinic,
      isLoading: false,
      isSaving: false,
      error: null,
    });
  };

  const updateClinic = async (updates: Partial<Omit<ClinicData, 'id'>>) => {
    if (!state.clinic?.id) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      const { error } = await supabase
        .from('clinics')
        .update(updates)
        .eq('id', state.clinic.id);

      if (error) {
        setState(prev => ({ ...prev, error: error.message }));
        return;
      }

      setState(prev => ({
        ...prev,
        clinic: prev.clinic ? { ...prev.clinic, ...updates } : null,
      }));
    } catch (err: unknown) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Erro ao salvar dados da clínica',
      }));
    } finally {
      setState(prev => ({ ...prev, isSaving: false }));
    }
  };

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    fetchClinic();

    if (user?.clinicId) {
      channel = supabase
        .channel(uniqueChannelName('clinic-mgmt', user.clinicId))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clinics', filter: `id=eq.${user.clinicId}` },
          () => { if (!cancelled) void fetchClinic(); }
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [user?.clinicId]);

  return { ...state, updateClinic, refresh: fetchClinic };
};
