import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';

export interface RankingEntry {
  patientId: string;
  patientName: string;
  level: number;
  experience: number;
  points: number;
  streakDays: number;
  clinicRank: number;
}

interface UseGamificationRankingState {
  ranking: RankingEntry[];
  isLoading: boolean;
  error: string | null;
}

const EMPTY_RANKING: RankingEntry[] = [];

export const useGamificationRanking = (limit = 50): UseGamificationRankingState => {
  const { user } = useAuthContext();
  const clinicId = user?.clinicId ?? null;

  const { data, isLoading, error } = useSupabaseQuery<RankingEntry[]>({
    fetcher: async () => {
      const { data, error } = await supabase.rpc('get_gamification_ranking', { p_limit: limit });
      if (error) throw error;

      return (data ?? []).map(row => ({
        patientId: row.patient_id,
        patientName: row.patient_name,
        level: row.level,
        experience: row.experience,
        points: row.points,
        streakDays: row.streak_days,
        clinicRank: row.clinic_rank,
      }));
    },
    channelPrefix: clinicId ? `ranking-${clinicId}` : 'ranking',
    realtime: [{ table: 'gamification_stats' }],
    deps: [limit, clinicId],
  });

  return {
    ranking: data ?? EMPTY_RANKING,
    isLoading,
    error,
  };
};
