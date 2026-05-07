import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { uniqueChannelName } from '@/shared/utils/realtime';

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

export const useGamificationRanking = (limit = 50): UseGamificationRankingState => {
  const [state, setState] = useState<UseGamificationRankingState>({
    ranking: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetch = async () => {
      const { data, error } = await supabase.rpc('get_gamification_ranking', { p_limit: limit });

      if (cancelled) return;

      if (error || !data) {
        setState({ ranking: [], isLoading: false, error: error?.message ?? 'Erro ao carregar ranking' });
        return;
      }

      const ranking: RankingEntry[] = data.map(row => ({
        patientId: row.patient_id,
        patientName: row.patient_name,
        level: row.level,
        experience: row.experience,
        points: row.points,
        streakDays: row.streak_days,
        clinicRank: row.clinic_rank,
      }));

      setState({ ranking, isLoading: false, error: null });
    };

    fetch();

    channel = supabase
      .channel(uniqueChannelName('ranking'))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gamification_stats' },
        () => { void fetch(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [limit]);

  return state;
};
