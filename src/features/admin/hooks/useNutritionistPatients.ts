import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { uniqueChannelName } from '@/shared/utils/realtime';

export interface NutritionistPatient {
  id: string;
  name: string;
  level: number;
  streakDays: number;
  points: number;
  experience: number;
}

interface State {
  patients: NutritionistPatient[];
  isLoading: boolean;
  error: string | null;
}

export const useNutritionistPatients = (nutritionistId: string) => {
  const [state, setState] = useState<State>({
    patients: [],
    isLoading: true,
    error: null,
  });

  const fetch = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const { data, error } = await supabase
      .from('gamification_stats')
      .select(`
        patient_id,
        level,
        streak_days,
        points,
        experience,
        patient:profiles!gamification_stats_patient_id_fkey(id, name)
      `)
      .eq('nutritionist_id', nutritionistId)
      .order('points', { ascending: false });

    if (error || !data) {
      setState({ patients: [], isLoading: false, error: error?.message ?? 'Erro ao carregar pacientes' });
      return;
    }

    const patients: NutritionistPatient[] = data.map(row => {
      const patient = Array.isArray(row.patient) ? row.patient[0] : row.patient;
      return {
        id: row.patient_id,
        name: (patient as { name?: string } | null)?.name ?? 'Paciente',
        level: row.level,
        streakDays: row.streak_days,
        points: row.points,
        experience: row.experience,
      };
    });

    setState({ patients, isLoading: false, error: null });
  };

  useEffect(() => {
    if (!nutritionistId) return;
    let cancelled = false;

    void fetch();

    const channel = supabase
      .channel(uniqueChannelName('nutritionist-patients', nutritionistId))
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'gamification_stats',
          filter: `nutritionist_id=eq.${nutritionistId}`,
        },
        () => { if (!cancelled) void fetch(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [nutritionistId]);

  return { ...state, refresh: fetch };
};
