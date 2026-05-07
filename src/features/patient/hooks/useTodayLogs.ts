import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { LogType } from '@/shared/infrastructure/supabase/database.types';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';

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

const todayIso = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const useTodayLogs = (): TodayLogsState => {
  const [state, setState] = useState<TodayLogsState>({
    meals: [],
    totalCalories: 0,
    waterMl: 0,
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

      const today = todayIso();

      const { data, error } = await supabase
        .from('meal_logs')
        .select('id, food_name, calories, quantity, unit, category, logged_at')
        .eq('patient_id', userId)
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

    fetch();
    return () => { cancelled = true; };
  }, []);

  return state;
};
