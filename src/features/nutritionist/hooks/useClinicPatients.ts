import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';

export interface ClinicPatient {
  id: string;
  name: string;
  level: number;
  streakDays: number;
  points: number;
}

interface UseClinicPatientsState {
  patients: ClinicPatient[];
  totalCount: number;
  lowEngagement: ClinicPatient[];
  isLoading: boolean;
  error: string | null;
}

export const useClinicPatients = () => {
  const [state, setState] = useState<UseClinicPatientsState>({
    patients: [],
    totalCount: 0,
    lowEngagement: [],
    isLoading: true,
    error: null,
  });

  const fetch = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    const userId = await getCachedUserId();
    if (!userId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // 1. Get current user clinic with explicit UUID
    const { data: profileData } = await supabase
      .from('profiles')
      .select('clinic_id')
      .eq('id', userId)
      .maybeSingle();
    
    const clinicId = profileData?.clinic_id;
    if (!clinicId) {
      setState(prev => ({ ...prev, isLoading: false, error: 'Clínica não encontrada' }));
      return;
    }

    // 2. Query patients and their stats
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        stats:gamification_stats(
          level,
          streak_days,
          points
        )
      `)
      .eq('role', 'PATIENT')
      .eq('clinic_id', clinicId)
      .order('name', { ascending: true });

    if (error || !data) {
      setState(prev => ({ ...prev, isLoading: false, error: error?.message ?? 'Erro ao carregar pacientes' }));
      return;
    }

    const patients: ClinicPatient[] = data.map(row => {
      const stats = (row.stats as any)?.[0] || { level: 1, streak_days: 0, points: 0 };
      return {
        id: row.id,
        name: row.name,
        level: stats.level,
        streakDays: stats.streak_days,
        points: stats.points,
      };
    });

    const lowEngagement = patients.filter(p => p.streakDays <= 2 || p.points < 100).slice(0, 5);

    setState({
      patients,
      totalCount: patients.length,
      lowEngagement,
      isLoading: false,
      error: null,
    });
  };

  useEffect(() => {
    fetch();
  }, []);

  return { ...state, refresh: fetch };
};
