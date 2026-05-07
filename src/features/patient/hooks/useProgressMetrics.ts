import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { LogType } from '@/shared/infrastructure/supabase/database.types';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';

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

interface ProgressLogRow {
  calories: number | null;
  quantity: number;
  unit: string;
  category: LogType;
  logged_at: string;
}

const toDateKey = (date: Date) => date.toISOString().split('T')[0];

const buildLastSevenDays = () => {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return {
      date,
      dateKey: toDateKey(date),
      dayLabel: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
    };
  });
};

const uniqueChannelName = (prefix: string, patientId: string) =>
  `${prefix}-${patientId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useProgressMetrics = (patientId?: string | null): ProgressMetricsState => {
  const baseDays = useMemo(buildLastSevenDays, []);
  const [state, setState] = useState<ProgressMetricsState>({
    days: baseDays.map(day => ({
      dateKey: day.dateKey,
      dayLabel: day.dayLabel,
      calories: 0,
      waterMl: 0,
      meals: 0,
      exercises: 0,
    })),
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetch = async (targetPatientId: string) => {
      const start = `${baseDays[0].dateKey}T00:00:00`;
      const end = `${baseDays[baseDays.length - 1].dateKey}T23:59:59`;

      const { data, error } = await supabase
        .from('meal_logs')
        .select('calories, quantity, unit, category, logged_at')
        .eq('patient_id', targetPatientId)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .is('deleted_at', null)
        .order('logged_at', { ascending: true });

      if (cancelled) return;

      if (error || !data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error?.message ?? 'Erro ao carregar evolução',
        }));
        return;
      }

      const totals = baseDays.reduce<Record<string, DailyProgressItem>>((acc, day) => {
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

      (data as ProgressLogRow[]).forEach(log => {
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

      setState({
        days: baseDays.map(day => totals[day.dateKey]),
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
        .channel(uniqueChannelName('progress-metrics', targetPatientId))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'meal_logs', filter: `patient_id=eq.${targetPatientId}` },
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
  }, [baseDays, patientId]);

  return state;
};
