import { supabase } from '@/shared/infrastructure/supabase/client';
import { GamificationState, nextLevelExperience } from '../domain/gamification';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from './useSupabaseQuery';

interface GamificationHookState extends GamificationState {
  isLoading: boolean;
  error: string | null;
}

/** Linha retornada por `gamification_stats`. */
interface GamificationStatsRow {
  points: number;
  level: number;
  experience: number;
  streak_days: number;
}

const EMPTY_GAMIFICATION_STATE: GamificationState = {
  stats: {
    points: 0,
    level: 1,
    experience: 0,
    nextLevelExperience: 500,
    streakDays: 0,
  },
  badges: [],
};

const toGamificationState = (row: GamificationStatsRow | null): GamificationState => {
  if (!row) return EMPTY_GAMIFICATION_STATE;

  return {
    stats: {
      points: row.points,
      level: row.level,
      experience: row.experience,
      nextLevelExperience: nextLevelExperience(row.level),
      streakDays: row.streak_days,
    },
    badges: [],
  };
};

const fetchGamificationState = async (targetPatientId: string): Promise<GamificationState> => {
  const { data, error } = await supabase
    .from('gamification_stats')
    .select('points, level, experience, streak_days')
    .eq('patient_id', targetPatientId)
    .maybeSingle();

  if (error) throw error;

  return toGamificationState(data);
};

export const useGamification = (patientId?: string | null): GamificationHookState => {
  const { user } = useAuthContext();
  const targetPatientId = patientId === null ? null : (patientId ?? user?.id ?? null);

  const { data, isLoading, error } = useSupabaseQuery<GamificationState>({
    fetcher: () => {
      if (!targetPatientId) return Promise.resolve(EMPTY_GAMIFICATION_STATE);
      return fetchGamificationState(targetPatientId);
    },
    enabled: Boolean(targetPatientId),
    channelPrefix: `gamification-${targetPatientId ?? 'anon'}`,
    realtime: targetPatientId
      ? [{ table: 'gamification_stats', filter: `patient_id=eq.${targetPatientId}` }]
      : undefined,
    deps: [patientId, user?.id],
  });

  return {
    stats: data?.stats ?? EMPTY_GAMIFICATION_STATE.stats,
    badges: data?.badges ?? EMPTY_GAMIFICATION_STATE.badges,
    isLoading,
    error,
  };
};
