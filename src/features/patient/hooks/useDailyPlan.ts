import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { todayIso } from '@/shared/utils/date';
import type { MealTimeType, MeasurementUnit } from '@/features/nutrition';

export type { MealTimeType, MeasurementUnit } from '@/features/nutrition';

/**
 * Shape retornado por `get_today_plan` — subconjunto do `PlanItem` canônico
 * de `@/features/nutrition` (sem `planId`/`planTitle`/`adherencePct`, que a
 * RPC não devolve).
 */
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

/** Linha bruta retornada por `get_today_plan`, tipada na borda da RPC. */
interface GetTodayPlanRow {
  item_id: string;
  meal_time: MealTimeType;
  food_name: string;
  prescribed_qty: number;
  prescribed_unit: MeasurementUnit;
  prescribed_cal: number | null;
  purpose: string | null;
  sequence: number;
  log_id: string | null;
  actual_qty: number | null;
  actual_unit: MeasurementUnit | null;
  actual_cal: number | null;
  logged_at: string | null;
  xp_earned: number | null;
  log_notes: string | null;
}

const mapRow = (row: GetTodayPlanRow): PlanItem => ({
  itemId:         row.item_id,
  mealTime:       row.meal_time,
  foodName:       row.food_name,
  prescribedQty:  row.prescribed_qty,
  prescribedUnit: row.prescribed_unit,
  prescribedCal:  row.prescribed_cal,
  purpose:        row.purpose,
  sequence:       row.sequence,
  logId:          row.log_id,
  actualQty:      row.actual_qty,
  actualUnit:     row.actual_unit,
  actualCal:      row.actual_cal,
  loggedAt:       row.logged_at,
  xpEarned:       row.xp_earned ?? 0,
  logNotes:       row.log_notes,
});

export function useDailyPlan(): DailyPlanState {
  const { user } = useAuthContext();
  const userId = user?.id;

  const { data, isLoading, error, refresh } = useSupabaseQuery<PlanItem[]>({
    fetcher: async () => {
      const { data, error: err } = await supabase.rpc('get_today_plan', { p_date: todayIso() });
      if (err) throw err;
      const rows = (data ?? []) as GetTodayPlanRow[];
      return rows.map(mapRow);
    },
    enabled: Boolean(userId),
    channelPrefix: 'daily-plan',
    realtime: userId
      ? [{ table: 'meal_logs', filter: `patient_id=eq.${userId}` }]
      : undefined,
    deps: [userId],
  });

  return { planItems: data ?? [], isLoading, error, refresh };
}
