import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { LogType } from '@/shared/infrastructure/supabase/database.types';
import type { MeasurementUnit } from '@/features/nutrition';
import { toDateKey } from '@/shared/utils/date';

export interface DailyProgressItem {
  dateKey: string;
  dayLabel: string;
  calories: number;
  waterMl: number;
  meals: number;
  exercises: number;
}

interface ProgressMetricsState {
  days: DailyProgressItem[];
  isLoading: boolean;
  error: string | null;
}

/** Linha bruta retornada pela consulta a `meal_logs`, tipada na borda. */
interface ProgressLogRow {
  calories: number | null;
  quantity: number;
  unit: MeasurementUnit;
  category: LogType;
  logged_at: string;
}

interface ProgressDay {
  dateKey: string;
  dayLabel: string;
}

const DAYS_IN_WINDOW = 7;

/** Computa a janela dos últimos 7 dias (incluindo hoje), recalculada a cada fetch. */
const buildLastSevenDays = (): ProgressDay[] => {
  const today = new Date();
  return Array.from({ length: DAYS_IN_WINDOW }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (DAYS_IN_WINDOW - 1 - index));
    return {
      dateKey: toDateKey(date),
      dayLabel: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    };
  });
};

const emptyDays = (days: ProgressDay[]): DailyProgressItem[] =>
  days.map(day => ({
    dateKey: day.dateKey,
    dayLabel: day.dayLabel,
    calories: 0,
    waterMl: 0,
    meals: 0,
    exercises: 0,
  }));

export const useProgressMetrics = (patientId?: string | null): ProgressMetricsState => {
  const { user } = useAuthContext();
  const targetPatientId = patientId === null ? null : (patientId ?? user?.id ?? null);

  const { data, isLoading, error } = useSupabaseQuery<DailyProgressItem[]>({
    fetcher: async () => {
      // Recalculada a cada execução — garante que a janela de 7 dias avance.
      const days = buildLastSevenDays();
      if (!targetPatientId) return emptyDays(days);

      const start = `${days[0].dateKey}T00:00:00`;
      const end = `${days[days.length - 1].dateKey}T23:59:59`;

      const { data, error: err } = await supabase
        .from('meal_logs')
        .select('calories, quantity, unit, category, logged_at')
        .eq('patient_id', targetPatientId)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .is('deleted_at', null)
        .order('logged_at', { ascending: true });

      if (err) throw err;

      const totals = days.reduce<Record<string, DailyProgressItem>>((acc, day) => {
        acc[day.dateKey] = {
          dateKey: day.dateKey,
          dayLabel: day.dayLabel,
          calories: 0,
          waterMl: 0,
          meals: 0,
          exercises: 0,
        };
        return acc;
      }, {});

      const rows = (data ?? []) as ProgressLogRow[];
      rows.forEach(log => {
        const key = toDateKey(new Date(log.logged_at));
        const day = totals[key];
        if (!day) return;

        if (log.category === 'MEAL') {
          day.calories += log.calories ?? 0;
          day.meals += 1;
        }

        if (log.category === 'WATER' && log.unit === 'MILLILITERS') {
          day.waterMl += log.quantity;
        }

        if (log.category === 'EXERCISE') {
          day.exercises += 1;
        }
      });

      return days.map(day => totals[day.dateKey]);
    },
    enabled: true,
    channelPrefix: 'progress-metrics',
    realtime: targetPatientId
      ? [{ table: 'meal_logs', filter: `patient_id=eq.${targetPatientId}` }]
      : undefined,
    deps: [targetPatientId],
  });

  return {
    days: data ?? emptyDays(buildLastSevenDays()),
    isLoading,
    error,
  };
};
