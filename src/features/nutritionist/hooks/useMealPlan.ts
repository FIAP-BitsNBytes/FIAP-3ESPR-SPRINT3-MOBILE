import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
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

export function useMealPlan(patientId: string | null, date?: string): UseMealPlanReturn {
  const [items, setItems] = useState<NutritionistPlanItem[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState<string | null>(null);
  const [planStartDate, setPlanStartDate] = useState<string | null>(null);
  const [planEndDate, setPlanEndDate] = useState<string | null>(null);
  const [planNotes, setPlanNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!patientId) {
      setItems([]);
      setPlanId(null);
      setPlanTitle(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchSummary = async () => {
      const { data, error: err } = await supabase.rpc('get_patient_plan_summary', {
        p_patient_id: patientId,
        p_date:       date ?? new Date().toISOString().slice(0, 10),
      });

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setIsLoading(false);
        return;
      }

      const rows = (data ?? []) as Record<string, unknown>[];

      if (rows.length === 0) {
        setItems([]);
        setPlanId(null);
        setPlanTitle(null);
        setPlanStartDate(null);
        setPlanEndDate(null);
        setPlanNotes(null);
        setIsLoading(false);
        return;
      }

      const mapped: NutritionistPlanItem[] = rows.map(row => ({
        planId:         row.plan_id as string,
        planTitle:      row.plan_title as string,
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
        adherencePct:   (row.adherence_pct as number) ?? 0,
      }));

      setItems(mapped);
      setPlanId(mapped[0].planId);
      setPlanTitle(mapped[0].planTitle);

      const { data: planDetails } = await supabase
        .from('meal_plans')
        .select('start_date, end_date, notes')
        .eq('id', mapped[0].planId)
        .single();

      if (!cancelled) {
        setPlanStartDate(planDetails?.start_date ?? null);
        setPlanEndDate(planDetails?.end_date ?? null);
        setPlanNotes(planDetails?.notes ?? null);
      }

      setError(null);
      setIsLoading(false);
    };

    fetchSummary();
    return () => { cancelled = true; };
  }, [patientId, date, tick]);

  const createPlan = async (params: CreatePlanParams) => {
    if (!patientId) return { success: false as const, error: 'Paciente nao selecionado' };
    setIsSubmitting(true);
    try {
      const { data, error: err } = await supabase.rpc('create_meal_plan', {
        p_patient_id: patientId,
        p_title:      params.title,
        p_start_date: params.startDate,
        p_end_date:   params.endDate ?? undefined,
        p_notes:      params.notes ?? undefined,
      });
      if (err) return { success: false as const, error: err.message };
      refresh();
      return { success: true as const, planId: data as string };
    } catch {
      return { success: false as const, error: 'Erro ao criar plano' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const upsertItem = async (params: UpsertItemParams) => {
    setIsSubmitting(true);
    try {
      const { data, error: err } = await supabase.rpc('upsert_meal_plan_item', {
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
      refresh();
      return { success: true as const, itemId: data as string };
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

  return { items, planId, planTitle, planStartDate, planEndDate, planNotes, isLoading, error, isSubmitting, refresh, createPlan, upsertItem, deleteItem };
}
