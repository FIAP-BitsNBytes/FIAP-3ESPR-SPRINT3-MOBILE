import { supabase } from '@/shared/infrastructure/supabase/client';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';

export interface NutritionistPatient {
  id: string;
  name: string;
  level: number;
  streakDays: number;
  points: number;
  experience: number;
}

type PatientRelation = { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;

const firstPatient = (patient: PatientRelation): { id: string; name?: string | null } | null => {
  if (Array.isArray(patient)) return patient[0] ?? null;
  return patient;
};

export const useNutritionistPatients = (nutritionistId: string) => {
  const { data, isLoading, error, refresh } = useSupabaseQuery<NutritionistPatient[]>({
    fetcher: async () => {
      const { data: rows, error: fetchErr } = await supabase
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

      if (fetchErr) throw fetchErr;

      return (rows ?? []).map(row => {
        const patient = firstPatient(row.patient);
        return {
          id: row.patient_id,
          name: patient?.name ?? 'Paciente',
          level: row.level,
          streakDays: row.streak_days,
          points: row.points,
          experience: row.experience,
        };
      });
    },
    enabled: Boolean(nutritionistId),
    channelPrefix: `nutritionist-patients-${nutritionistId}`,
    realtime: [{ table: 'gamification_stats', filter: `nutritionist_id=eq.${nutritionistId}` }],
    deps: [nutritionistId],
  });

  return { patients: data ?? [], isLoading, error, refresh };
};
