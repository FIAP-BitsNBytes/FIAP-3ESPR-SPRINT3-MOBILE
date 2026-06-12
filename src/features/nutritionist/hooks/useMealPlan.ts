import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import { todayIso } from '@/shared/utils/date';
import type { MealTimeType, MeasurementUnit } from '@/features/patient/hooks/useDailyPlan';

export interface NutritionistPlanItem {
  planId: string;
  planTitle: string;
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
  adherencePct: number;
}

export interface CreatePlanParams {
  title: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}

export interface UpsertItemParams {
  planId: string;
  mealTime: MealTimeType;
  foodName: string;
  qty: number;
  unit: MeasurementUnit;
  calories?: number | null;
  purpose?: string | null;
  notes?: string | null;
  sequence?: number;
  itemId?: string | null;
}

interface UseMealPlanReturn {
  items: NutritionistPlanItem[];
  planId: string | null;
  planTitle: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
  planNotes: string | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  refresh: () => void;
  createPlan: (params: CreatePlanParams) => Promise<{ success: true; planId: string } | { success: false; error: string }>;
  upsertItem: (params: UpsertItemParams) => Promise<{ success: true; itemId: string } | { success: false; error: string }>;
  deleteItem: (itemId: string) => Promise<{ success: true } | { success: false; error: string }>;
}

/** Linha retornada por `get_patient_plan_summary` (RPC). */
interface PatientPlanSummaryRow {
  plan_id: string;
  plan_title: string;
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
  adherence_pct: number | null;
}

/** Metadados do plano (tabela `meal_plans`). */
interface MealPlanMeta {
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
}

interface MealPlanSummaryData {
  items: NutritionistPlanItem[];
  planId: string | null;
  planTitle: string | null;
  plan: MealPlanMeta;
}

const EMPTY_PLAN_META: MealPlanMeta = { startDate: null, endDate: null, notes: null };
const EMPTY_SUMMARY: MealPlanSummaryData = { items: [], planId: null, planTitle: null, plan: EMPTY_PLAN_META };

const toNutritionistPlanItem = (row: PatientPlanSummaryRow): NutritionistPlanItem => ({
  planId: row.plan_id,
  planTitle: row.plan_title,
  itemId: row.item_id,
  mealTime: row.meal_time,
  foodName: row.food_name,
  prescribedQty: row.prescribed_qty,
  prescribedUnit: row.prescribed_unit,
  prescribedCal: row.prescribed_cal,
  purpose: row.purpose,
  sequence: row.sequence,
  logId: row.log_id,
  actualQty: row.actual_qty,
  actualUnit: row.actual_unit,
  actualCal: row.actual_cal,
  loggedAt: row.logged_at,
  xpEarned: row.xp_earned ?? 0,
  adherencePct: row.adherence_pct ?? 0,
});

const fetchMealPlanSummary = async (patientId: string, date: string): Promise<MealPlanSummaryData> => {
  const { data, error } = await supabase.rpc('get_patient_plan_summary', {
    p_patient_id: patientId,
    p_date: date,
  });
  if (error) throw error;

  const rows = (data ?? []) as PatientPlanSummaryRow[];

  if (rows.length === 0) {
    return EMPTY_SUMMARY;
  }

  const items = rows.map(toNutritionistPlanItem);
  const planId = items[0].planId;
  const planTitle = items[0].planTitle;

  const { data: planDetails, error: planError } = await supabase
    .from('meal_plans')
    .select('start_date, end_date, notes')
    .eq('id', planId)
    .single();
  if (planError) throw planError;

  return {
    items,
    planId,
    planTitle,
    plan: {
      startDate: planDetails?.start_date ?? null,
      endDate: planDetails?.end_date ?? null,
      notes: planDetails?.notes ?? null,
    },
  };
};

export function useMealPlan(patientId: string | null, date?: string): UseMealPlanReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const today = date ?? todayIso();

  const { data, isLoading, error, refresh } = useSupabaseQuery<MealPlanSummaryData>({
    fetcher: async () => {
      if (!patientId) return EMPTY_SUMMARY;
      return fetchMealPlanSummary(patientId, today);
    },
    enabled: Boolean(patientId),
    channelPrefix: 'meal-plan-editor',
    realtime: patientId
      ? [
          { table: 'meal_plan_items' },
          { table: 'meal_plans' },
        ]
      : undefined,
    deps: [patientId, today],
  });

  const summary = data ?? EMPTY_SUMMARY;

  const createPlan = async (params: CreatePlanParams) => {
    if (!patientId) return { success: false as const, error: 'Paciente nao selecionado' };
    setIsSubmitting(true);
    try {
      const { data: newPlanId, error: err } = await supabase.rpc('create_meal_plan', {
        p_patient_id: patientId,
        p_title:      params.title,
        p_start_date: params.startDate,
        p_end_date:   params.endDate ?? undefined,
        p_notes:      params.notes ?? undefined,
      });
      if (err) return { success: false as const, error: err.message };
      if (!newPlanId) return { success: false as const, error: 'Erro ao criar plano' };
      refresh();
      return { success: true as const, planId: newPlanId };
    } catch {
      return { success: false as const, error: 'Erro ao criar plano' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const upsertItem = async (params: UpsertItemParams) => {
    setIsSubmitting(true);
    try {
      const { data: newItemId, error: err } = await supabase.rpc('upsert_meal_plan_item', {
        p_plan_id:   params.planId,
        p_meal_time: params.mealTime,
        p_food_name: params.foodName,
        p_qty:       params.qty,
        p_unit:      params.unit,
        p_calories:  params.calories ?? undefined,
        p_purpose:   params.purpose ?? undefined,
        p_notes:     params.notes ?? undefined,
        p_sequence:  params.sequence ?? 0,
        p_item_id:   params.itemId ?? undefined,
      });
      if (err) return { success: false as const, error: err.message };
      if (!newItemId) return { success: false as const, error: 'Erro ao salvar item' };
      refresh();
      return { success: true as const, itemId: newItemId };
    } catch {
      return { success: false as const, error: 'Erro ao salvar item' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    setIsSubmitting(true);
    try {
      const { error: err } = await supabase.rpc('delete_meal_plan_item', { p_item_id: itemId });
      if (err) return { success: false as const, error: err.message };
      refresh();
      return { success: true as const };
    } catch {
      return { success: false as const, error: 'Erro ao remover item' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items: summary.items,
    planId: summary.planId,
    planTitle: summary.planTitle,
    planStartDate: summary.plan.startDate,
    planEndDate: summary.plan.endDate,
    planNotes: summary.plan.notes,
    isLoading,
    error,
    isSubmitting,
    refresh,
    createPlan,
    upsertItem,
    deleteItem,
  };
}
