import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { LogType } from '@/shared/infrastructure/supabase/database.types';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { todayIso } from '@/shared/utils/date';
import { uniqueChannelName } from '@/shared/utils/realtime';

export interface MealLogItem {
  id: string;
  foodName: string;
  calories: number | null;
  quantity: number;
  unit: string;
  category: LogType;
  loggedAt: string;
}

interface TodayLogsState {
  meals: MealLogItem[];
  totalCalories: number;
  waterMl: number;
  isLoading: boolean;
  error: string | null;
}

export const useTodayLogs = (patientId?: string | null): TodayLogsState => {
  const { user } = useAuthContext();
  const [state, setState] = useState<TodayLogsState>({
    meals: [],
    totalCalories: 0,
    waterMl: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetch = async (targetPatientId: string) => {
      const today = todayIso();

      const { data, error } = await supabase
        .from('meal_logs')
        .select('id, food_name, calories, quantity, unit, category, logged_at')
        .eq('patient_id', targetPatientId)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`)
        .is('deleted_at', null)
        .order('logged_at', { ascending: true });

      if (cancelled) return;

      if (error || !data) {
        setState(prev => ({ ...prev, isLoading: false, error: error?.message ?? 'Erro ao carregar registros' }));
        return;
      }

      const meals: MealLogItem[] = data.map(row => ({
        id: row.id,
        foodName: row.food_name,
        calories: row.calories,
        quantity: row.quantity,
        unit: row.unit,
        category: row.category,
        loggedAt: row.logged_at,
      }));

      const totalCalories = meals
        .filter(m => m.category === 'MEAL')
        .reduce((sum, m) => sum + (m.calories ?? 0), 0);

      // Water logs use MILLILITERS unit — sum quantity directly
      const waterMl = meals
        .filter(m => m.category === 'WATER' && m.unit === 'MILLILITERS')
        .reduce((sum, m) => sum + m.quantity, 0);

      setState({ meals, totalCalories, waterMl, isLoading: false, error: null });
    };

    const targetPatientId = patientId === null ? null : (patientId ?? user?.id);
    if (!targetPatientId) {
      if (!cancelled) setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    fetch(targetPatientId);

    channel = supabase
      .channel(uniqueChannelName('today-logs', targetPatientId))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_logs', filter: `patient_id=eq.${targetPatientId}` },
        () => { void fetch(targetPatientId); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [patientId, user?.id]);

  return state;
};
