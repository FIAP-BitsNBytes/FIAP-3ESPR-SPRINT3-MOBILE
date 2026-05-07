import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';

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
  const [state, setState] = useState<UseClinicManagementState>({
    clinic: null,
    isLoading: true,
    isSaving: false,
    error: null,
  });

  const fetchClinic = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    const userId = await getCachedUserId();
    if (!userId) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Usuário não autenticado.' }));
      return;
    }

    // 1. Get current user's clinic ID with explicit UUID filter
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', userId)
      .maybeSingle();

    if (profileErr || !profile?.clinic_id) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Não foi possível encontrar sua clínica.' }));
      return;
    }

    // 2. Fetch clinic details
    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('id, name, phone')
      .eq('id', profile.clinic_id)
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

    const { error } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', state.clinic.id);

    if (error) {
      setState(prev => ({ ...prev, isSaving: false, error: error.message }));
      return;
    }

    setState(prev => ({
      ...prev,
      isSaving: false,
      clinic: prev.clinic ? { ...prev.clinic, ...updates } : null,
    }));
  };

  useEffect(() => {
    fetchClinic();
  }, []);

  return { ...state, updateClinic, refresh: fetchClinic };
};
