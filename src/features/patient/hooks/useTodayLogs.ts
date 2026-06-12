import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { LogType } from '@/shared/infrastructure/supabase/database.types';
import type { MeasurementUnit } from '@/features/nutrition';
import { todayIso } from '@/shared/utils/date';

export interface MealLogItem {
  id: string;
  foodName: string;
  calories: number | null;
  quantity: number;
  unit: string;
  category: LogType;
  loggedAt: string;
  source?: string;
}

interface TodayLogsState {
  meals: MealLogItem[];
  totalCalories: number;
  waterMl: number;
  isLoading: boolean;
  error: string | null;
}

interface TodayLogsData {
  meals: MealLogItem[];
  totalCalories: number;
  waterMl: number;
}

/** Linha bruta retornada pela consulta a `meal_logs`, tipada na borda. */
interface MealLogRow {
  id: string;
  food_name: string;
  calories: number | null;
  quantity: number;
  unit: MeasurementUnit;
  category: LogType;
  logged_at: string;
  source?: string;
}

const EMPTY_DATA: TodayLogsData = { meals: [], totalCalories: 0, waterMl: 0 };

export const useTodayLogs = (patientId?: string | null): TodayLogsState => {
  const { user } = useAuthContext();
  const targetPatientId = patientId === null ? null : (patientId ?? user?.id ?? null);

  const { data, isLoading, error } = useSupabaseQuery<TodayLogsData>({
    fetcher: async () => {
      if (!targetPatientId) return EMPTY_DATA;
      const today = todayIso();

      const { data, error: err } = await supabase
        .from('meal_logs')
        .select('id, food_name, calories, quantity, unit, category, logged_at, source')
        .eq('patient_id', targetPatientId)
        .gte('logged_at', `${today}T00:00:00`)
        .lte('logged_at', `${today}T23:59:59`)
        .is('deleted_at', null)
        .order('logged_at', { ascending: true });

      if (err) throw err;

      const rows = (data ?? []) as unknown as MealLogRow[];
      const meals: MealLogItem[] = rows.map(row => ({
        id: row.id,
        foodName: row.food_name,
        calories: row.calories,
        quantity: row.quantity,
        unit: row.unit,
        category: row.category,
        loggedAt: row.logged_at,
        source: row.source ?? 'manual',
      }));

      const totalCalories = meals
        .filter(m => m.category === 'MEAL')
        .reduce((sum, m) => sum + (m.calories ?? 0), 0);

      // Water logs use MILLILITERS unit — sum quantity directly
      const waterMl = meals
        .filter(m => m.category === 'WATER' && m.unit === 'MILLILITERS')
        .reduce((sum, m) => sum + m.quantity, 0);

      return { meals, totalCalories, waterMl };
    },
    enabled: targetPatientId !== null,
    channelPrefix: 'today-logs',
    realtime: targetPatientId
      ? [{ table: 'meal_logs', filter: `patient_id=eq.${targetPatientId}` }]
      : undefined,
    deps: [targetPatientId],
  });

  const result = data ?? EMPTY_DATA;
  return { ...result, isLoading, error };
};
