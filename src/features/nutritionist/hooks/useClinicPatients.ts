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
  experience: number;
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

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'PATIENT')
      .eq('clinic_id', user.clinicId)
      .order('name', { ascending: true });

    if (profilesError || !profilesData) {
      setState(prev => ({ ...prev, isLoading: false, error: profilesError?.message ?? 'Erro ao carregar pacientes' }));
      return;
    }

    const patientIds = profilesData.map(p => p.id);
    const statsMap = new Map<string, { level: number; streak_days: number; points: number; experience: number }>();

    if (patientIds.length > 0) {
      const { data: statsData } = await supabase
        .from('gamification_stats')
        .select('patient_id, level, streak_days, points, experience')
        .in('patient_id', patientIds);

      statsData?.forEach(s => statsMap.set(s.patient_id, s));
    }

    const patients: ClinicPatient[] = profilesData.map(row => {
      const stats = statsMap.get(row.id) ?? { level: 1, streak_days: 0, points: 0, experience: 0 };
      return {
        id: row.id,
        name: row.name,
        level: stats.level,
        streakDays: stats.streak_days,
        points: stats.points,
        experience: stats.experience,
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
