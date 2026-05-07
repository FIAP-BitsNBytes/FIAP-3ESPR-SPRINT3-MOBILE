import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { uniqueChannelName } from '@/shared/utils/realtime';

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
  const { user } = useAuthContext();
  const [state, setState] = useState<UseClinicPatientsState>({
    patients: [],
    totalCount: 0,
    lowEngagement: [],
    isLoading: true,
    error: null,
  });

  const fetch = async () => {
    if (!user?.clinicId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Query patients and their stats
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        stats:gamification_stats!gamification_stats_patient_id_fkey(
          level,
          streak_days,
          points
        )
      `)
      .eq('role', 'PATIENT')
      .eq('clinic_id', user.clinicId)
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
    let cancelled = false;
    let channelStats: ReturnType<typeof supabase.channel> | null = null;
    let channelProfiles: ReturnType<typeof supabase.channel> | null = null;

    fetch();

    if (user?.clinicId) {
      // Monitora mudanças em gamification_stats
      channelStats = supabase
        .channel(uniqueChannelName('clinic-stats', user.clinicId))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gamification_stats' },
          () => { if (!cancelled) void fetch(); }
        )
        .subscribe();

      // Monitora novos pacientes ou mudanças de perfil na clínica
      channelProfiles = supabase
        .channel(uniqueChannelName('clinic-profiles', user.clinicId))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `clinic_id=eq.${user.clinicId}` },
          () => { if (!cancelled) void fetch(); }
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channelStats) void supabase.removeChannel(channelStats);
      if (channelProfiles) void supabase.removeChannel(channelProfiles);
    };
  }, [user?.clinicId]);

  return { ...state, refresh: fetch };
};
