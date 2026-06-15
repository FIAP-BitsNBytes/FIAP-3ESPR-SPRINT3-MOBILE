import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import { todayIso } from '@/shared/utils/date';
import { usePlanPermissions } from './usePlanPermissions';
import type { PlanItem, PlanMeta, MealTimeType, MeasurementUnit } from '../types';

/** Linha retornada por `get_patient_plan_summary` (RPC, visão do nutricionista). */
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
  photo_path: string | null;
}

/** Linha retornada por `get_today_plan` (RPC, visão do paciente). */
interface TodayPlanRow {
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
  photo_path: string | null;
}

/** Linha da tabela `meal_plans` (metadados do plano). */
interface MealPlanRow {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

export interface PlanQueryData {
  items: PlanItem[];
  plan: PlanMeta | null;
}

const toPlanMeta = (row: MealPlanRow): PlanMeta => ({
  id: row.id,
  title: row.title,
  startDate: row.start_date,
  endDate: row.end_date ?? null,
  notes: row.notes ?? null,
});

const fetchEditorPlan = async (patientId: string, date: string): Promise<PlanQueryData> => {
  const { data, error } = await supabase.rpc('get_patient_plan_summary', {
    p_patient_id: patientId,
    p_date: date,
  });
  if (error) throw error;

  const rows = (data ?? []) as PatientPlanSummaryRow[];

  if (rows.length === 0) {
    // Plano pode existir mas ainda não ter itens — busca metadados mesmo assim.
    const { data: emptyPlan, error: planError } = await supabase
      .from('meal_plans')
      .select('id, title, start_date, end_date, notes')
      .eq('patient_id', patientId)
      .eq('is_active', true)
      .maybeSingle();
    if (planError) throw planError;

    return {
      items: [],
      plan: emptyPlan ? toPlanMeta(emptyPlan as MealPlanRow) : null,
    };
  }

  const items: PlanItem[] = rows.map(row => ({
    itemId: row.item_id,
    planId: row.plan_id,
    planTitle: row.plan_title,
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
    logNotes: null,
    adherencePct: row.adherence_pct ?? null,
    photoPath: row.photo_path ?? null,
  }));

  const { data: planData, error: planError } = await supabase
    .from('meal_plans')
    .select('id, title, start_date, end_date, notes')
    .eq('id', items[0].planId)
    .single();
  if (planError) throw planError;

  return { items, plan: toPlanMeta(planData as MealPlanRow) };
};

const fetchPatientPlan = async (targetId: string, date: string): Promise<PlanQueryData> => {
  const { data, error } = await supabase.rpc('get_today_plan', { p_date: date });
  if (error) throw error;

  const rows = (data ?? []) as TodayPlanRow[];

  const { data: activePlan, error: planError } = await supabase
    .from('meal_plans')
    .select('id, title, start_date, end_date, notes')
    .eq('patient_id', targetId)
    .eq('is_active', true)
    .lte('start_date', date)
    .or(`end_date.is.null,end_date.gte.${date}`)
    .maybeSingle();
  if (planError) throw planError;

  const plan = activePlan ? toPlanMeta(activePlan as MealPlanRow) : null;

  const items: PlanItem[] = rows.map(row => ({
    itemId: row.item_id,
    planId: plan?.id ?? '',
    planTitle: plan?.title ?? '',
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
    logNotes: row.log_notes,
    adherencePct: null,
    photoPath: row.photo_path ?? null,
  }));

  return { items, plan };
};

const EMPTY_PLAN_QUERY_DATA: PlanQueryData = { items: [], plan: null };

export interface UsePlanQueryResult {
  items: PlanItem[];
  plan: PlanMeta | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Busca o plano alimentar (itens + metadados) com suporte a realtime.
 *
 * - `canEdit` (nutricionista/admin) → `get_patient_plan_summary(patientId, date)`,
 *   com fallback para metadados de `meal_plans` quando o plano não tem itens.
 * - Caso contrário (paciente) → `get_today_plan(date)` + metadados do plano ativo.
 *
 * Realtime: um único canal escuta `meal_logs` (filtrado pelo paciente/usuário alvo)
 * e `meal_plan_items` (sem filtro), disparando refetch.
 */
export function usePlanQuery(patientId?: string | null, date?: string): UsePlanQueryResult {
  const { user } = useAuthContext();
  const { canEdit } = usePlanPermissions();
  const today = date ?? todayIso();

  const targetId = canEdit ? (patientId ?? null) : (user?.id ?? null);

  const { data, isLoading, error, refresh } = useSupabaseQuery<PlanQueryData>({
    fetcher: async () => {
      if (!targetId) return EMPTY_PLAN_QUERY_DATA;
      return canEdit ? fetchEditorPlan(targetId, today) : fetchPatientPlan(targetId, today);
    },
    enabled: Boolean(targetId),
    channelPrefix: 'plan-detail',
    realtime: targetId
      ? [
          { table: 'meal_logs', filter: `patient_id=eq.${targetId}` },
          { table: 'meal_plan_items' },
        ]
      : undefined,
    deps: [canEdit, patientId, today, user?.id],
  });

  return {
    items: data?.items ?? [],
    plan: data?.plan ?? null,
    isLoading,
    error,
    refresh,
  };
}
