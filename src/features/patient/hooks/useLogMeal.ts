import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import type { MeasurementUnit } from './useDailyPlan';

interface MealFromPlanResult {
  logId: string;
  xpEarned: number;
  baseXp: number;
  adherenceBonus: number;
  completeDayBonus: number;
}

interface FreeMealResult {
  logId: string;
  xpEarned: number;
  freeCount: number;
}

type LogMealFromPlanReturn =
  | { success: true; data: MealFromPlanResult }
  | { success: false; error: string };

type LogFreeMealReturn =
  | { success: true; data: FreeMealResult }
  | { success: false; error: string };

export interface LogMealFromPlanParams {
  planItemId: string;
  actualQty: number;
  actualUnit: MeasurementUnit;
  actualCal?: number | null;
  notes?: string | null;
}

export interface LogFreeMealParams {
  foodName: string;
  qty: number;
  unit: MeasurementUnit;
  calories?: number | null;
  notes?: string | null;
}

interface UseLogMealReturn {
  logMealFromPlan: (params: LogMealFromPlanParams) => Promise<LogMealFromPlanReturn>;
  logFreeMeal: (params: LogFreeMealParams) => Promise<LogFreeMealReturn>;
  isLogging: boolean;
}

export function useLogMeal(): UseLogMealReturn {
  const [isLogging, setIsLogging] = useState(false);

  const logMealFromPlan = async (params: LogMealFromPlanParams): Promise<LogMealFromPlanReturn> => {
    setIsLogging(true);
    try {
      const { data, error } = await supabase.rpc('log_meal_from_plan', {
        p_plan_item_id: params.planItemId,
        p_actual_qty:   params.actualQty,
        p_actual_unit:  params.actualUnit,
        p_actual_cal:   params.actualCal ?? undefined,
        p_notes:        params.notes ?? undefined,
      });

      if (error) return { success: false, error: error.message };

      const r = data as {
        log_id: string;
        xp_earned: number;
        base_xp: number;
        adherence_bonus: number;
        complete_day_bonus: number;
      };

      return {
        success: true,
        data: {
          logId:            r.log_id,
          xpEarned:         r.xp_earned,
          baseXp:           r.base_xp,
          adherenceBonus:   r.adherence_bonus,
          completeDayBonus: r.complete_day_bonus,
        },
      };
    } catch {
      return { success: false, error: 'Erro ao registrar refeicao' };
    } finally {
      setIsLogging(false);
    }
  };

  const logFreeMeal = async (params: LogFreeMealParams): Promise<LogFreeMealReturn> => {
    setIsLogging(true);
    try {
      const { data, error } = await supabase.rpc('log_free_meal', {
        p_food_name: params.foodName,
        p_qty:       params.qty,
        p_unit:      params.unit,
        p_calories:  params.calories ?? undefined,
        p_notes:     params.notes ?? undefined,
      });

      if (error) return { success: false, error: error.message };

      const r = data as { log_id: string; xp_earned: number; free_count: number };
      return {
        success: true,
        data: { logId: r.log_id, xpEarned: r.xp_earned, freeCount: r.free_count },
      };
    } catch {
      return { success: false, error: 'Erro ao registrar refeicao' };
    } finally {
      setIsLogging(false);
    }
  };

  return { logMealFromPlan, logFreeMeal, isLogging };
}
