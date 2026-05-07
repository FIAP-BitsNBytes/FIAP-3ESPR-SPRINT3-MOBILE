import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { uniqueChannelName } from '@/shared/utils/realtime';

export type MealTimeType =
  | 'BREAKFAST'
  | 'MORNING_SNACK'
  | 'LUNCH'
  | 'AFTERNOON_SNACK'
  | 'DINNER'
  | 'EVENING_SNACK'
  | 'ANYTIME';

export type MeasurementUnit = 'GRAMS' | 'MILLILITERS' | 'UNITS' | 'PORTIONS' | 'CALORIES';

export interface PlanItem {
  itemId: string;
  mealTime: MealTimeType;
  foodName: string;
  prescribedQty: number;
  prescribedUnit: MeasurementUnit;
  prescribedCal: number | null;
  purpose: string | null;
  sequence: number;
  logId: string | null;
  actualQty: number | null;
  actualUnit: MeasurementUnit | null;
  actualCal: number | null;
  loggedAt: string | null;
  xpEarned: number;
  logNotes: string | null;
}

interface DailyPlanState {
  planItems: PlanItem[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useDailyPlan(): DailyPlanState {
  const { user } = useAuthContext();
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchPlan = async () => {
      setIsLoading(true);
      const { data, error: err } = await supabase.rpc('get_today_plan', {});

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as Record<string, unknown>[];
      const items: PlanItem[] = rows.map(row => ({
        itemId:         row.item_id as string,
        mealTime:       row.meal_time as MealTimeType,
        foodName:       row.food_name as string,
        prescribedQty:  row.prescribed_qty as number,
        prescribedUnit: row.prescribed_unit as MeasurementUnit,
        prescribedCal:  row.prescribed_cal as number | null,
        purpose:        row.purpose as string | null,
        sequence:       row.sequence as number,
        logId:          row.log_id as string | null,
        actualQty:      row.actual_qty as number | null,
        actualUnit:     row.actual_unit as MeasurementUnit | null,
        actualCal:      row.actual_cal as number | null,
        loggedAt:       row.logged_at as string | null,
        xpEarned:       (row.xp_earned as number) ?? 0,
        logNotes:       row.log_notes as string | null,
      }));

      setPlanItems(items);
      setError(null);
      setIsLoading(false);
    };

    fetchPlan();

    channel = supabase
      .channel(uniqueChannelName('daily-plan', user.id))
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meal_logs', filter: `patient_id=eq.${user.id}` },
        () => { void fetchPlan(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [user?.id, tick]);

  return { planItems, isLoading, error, refresh };
}
