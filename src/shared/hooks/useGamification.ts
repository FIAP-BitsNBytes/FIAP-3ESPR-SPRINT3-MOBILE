import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { GamificationState, nextLevelExperience } from '../domain/gamification';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';

interface GamificationHookState extends GamificationState {
  isLoading: boolean;
  error: string | null;
}

const uniqueChannelName = (prefix: string, patientId: string) =>
  `${prefix}-${patientId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useGamification = (patientId?: string | null): GamificationHookState => {
  const [state, setState] = useState<GamificationHookState>({
    stats: {
      points: 0,
      level: 1,
      experience: 0,
      nextLevelExperience: 500,
      streakDays: 0,
    },
    badges: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetch = async (targetPatientId: string) => {
      const { data, error } = await supabase
        .from('gamification_stats')
        .select('points, level, experience, streak_days')
        .eq('patient_id', targetPatientId)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message }));
        return;
      }

      if (!data) {
        // Fallback for new users or if stats haven't been initialized yet
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setState({
        stats: {
          points: data.points,
          level: data.level,
          experience: data.experience,
          nextLevelExperience: nextLevelExperience(data.level),
          streakDays: data.streak_days,
        },
        badges: [],
        isLoading: false,
        error: null,
      });
    };

    const initialize = async () => {
      const userId = await getCachedUserId();
      const targetPatientId = patientId === null ? null : (patientId ?? userId);

      if (!targetPatientId) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      await fetch(targetPatientId);

      if (cancelled) return;

      channel = supabase
        .channel(uniqueChannelName('gamification', targetPatientId))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'gamification_stats', filter: `patient_id=eq.${targetPatientId}` },
          () => { void fetch(targetPatientId); }
        )
        .subscribe();
    };

    initialize();
    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [patientId]);

  return state;
};
