import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { GamificationState, nextLevelExperience } from '../domain/gamification';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';

interface GamificationHookState extends GamificationState {
  isLoading: boolean;
  error: string | null;
}

export const useGamification = (): GamificationHookState => {
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

    const fetch = async () => {
      const userId = await getCachedUserId();

      if (!userId) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const { data, error } = await supabase
        .from('gamification_stats')
        .select('points, level, experience, streak_days')
        .eq('patient_id', userId)
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

    fetch();
    return () => { cancelled = true; };
  }, []);

  return state;
};
