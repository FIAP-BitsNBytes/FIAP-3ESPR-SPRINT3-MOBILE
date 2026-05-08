import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { uniqueChannelName } from '@/shared/utils/realtime';
import { usePlanPermissions } from './usePlanPermissions';
import type {
  PlanItem, PlanMeta,
  CreatePlanParams, UpsertItemParams, LogItemParams, LogItemResult,
  ActionResult, MealTimeType, MeasurementUnit,
} from '../types';

export interface PlanDetailState {
  items: PlanItem[];
  plan: PlanMeta | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  refresh: () => void;
  createPlan: (p: CreatePlanParams) => Promise<ActionResult<{ planId: string }>>;
  upsertItem: (p: UpsertItemParams) => Promise<ActionResult<{ itemId: string }>>;
  deleteItem: (itemId: string) => Promise<ActionResult<void>>;
  logItem: (p: LogItemParams) => Promise<ActionResult<LogItemResult>>;
}

export function usePlanDetail(patientId?: string | null, date?: string): PlanDetailState {
  const { user } = useAuthContext();
  const { canEdit } = usePlanPermissions();
  const today = date ?? new Date().toISOString().slice(0, 10);

  const [items, setItems] = useState<PlanItem[]>([]);
  const [plan, setPlan] = useState<PlanMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      if (canEdit) {
        if (!patientId) {
          setItems([]);
          setPlan(null);
          setIsLoading(false);
          return;
        }

        const { data, error: err } = await supabase.rpc('get_patient_plan_summary', {
          p_patient_id: patientId,
          p_date: today,
        });

        if (cancelled) return;
        if (err) { setError(err.message); setIsLoading(false); return; }

        const rows = (data ?? []) as Record<string, unknown>[];

        if (rows.length === 0) {
          // Plan may exist but have no items yet — still fetch it
          const { data: emptyPlan } = await supabase
            .from('meal_plans')
            .select('id, title, start_date, end_date, notes')
            .eq('patient_id', patientId)
            .eq('is_active', true)
            .maybeSingle();
          if (!cancelled) {
            setItems([]);
            setPlan(emptyPlan ? {
              id:        emptyPlan.id,
              title:     emptyPlan.title,
              startDate: emptyPlan.start_date,
              endDate:   emptyPlan.end_date ?? null,
              notes:     emptyPlan.notes ?? null,
            } : null);
            setIsLoading(false);
          }
          return;
        }

        const mapped: PlanItem[] = rows.map(row => ({
          itemId:         row.item_id as string,
          planId:         row.plan_id as string,
          planTitle:      row.plan_title as string,
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
          logNotes:       null,
          adherencePct:   (row.adherence_pct as number) ?? null,
        }));

        setItems(mapped);

        const { data: planData } = await supabase
          .from('meal_plans')
          .select('id, title, start_date, end_date, notes')
          .eq('id', mapped[0].planId)
          .single();

        if (!cancelled && planData) {
          setPlan({
            id:        planData.id,
            title:     planData.title,
            startDate: planData.start_date,
            endDate:   planData.end_date ?? null,
            notes:     planData.notes ?? null,
          });
        }

        setIsLoading(false);
        // Real-time: re-fetch when any log for this patient changes
        if (!channel && patientId) {
          channel = supabase
            .channel(uniqueChannelName('plan-detail', patientId))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_logs',       filter: `patient_id=eq.${patientId}` }, () => { void fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan_items'                                       }, () => { void fetchData(); })
            .subscribe();
        }
      } else {
        const targetId = user?.id;
        if (!targetId) { setIsLoading(false); return; }

        const { data, error: err } = await supabase.rpc('get_today_plan', { p_date: today });

        if (cancelled) return;
        if (err) { setError(err.message); setIsLoading(false); return; }

        const rows = (data ?? []) as Record<string, unknown>[];

        const { data: activePlan } = await supabase
          .from('meal_plans')
          .select('id, title, start_date, end_date, notes')
          .eq('patient_id', targetId)
          .eq('is_active', true)
          .lte('start_date', today)
          .or(`end_date.is.null,end_date.gte.${today}`)
          .maybeSingle();

        if (cancelled) return;

        // Always subscribe so the UI updates even when the plan is empty
        if (!channel) {
          channel = supabase
            .channel(uniqueChannelName('plan-detail', targetId))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_logs',       filter: `patient_id=eq.${targetId}` }, () => { void fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan_items'                                       }, () => { void fetchData(); })
            .subscribe();
        }

        const meta: PlanMeta | null = activePlan
          ? {
              id:        activePlan.id,
              title:     activePlan.title,
              startDate: activePlan.start_date,
              endDate:   activePlan.end_date ?? null,
              notes:     activePlan.notes ?? null,
            }
          : null;

        setPlan(meta);

        if (rows.length === 0) {
          setItems([]);
          setIsLoading(false);
          return;
        }

        const mapped: PlanItem[] = rows.map(row => ({
          itemId:         row.item_id as string,
          planId:         meta?.id ?? '',
          planTitle:      meta?.title ?? '',
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
          adherencePct:   null,
        }));

        setItems(mapped);
        setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [canEdit, patientId, today, tick, user?.id]);

  const createPlan = async (params: CreatePlanParams): Promise<ActionResult<{ planId: string }>> => {
    if (!patientId) return { success: false, error: 'Paciente não selecionado' };
    setIsSubmitting(true);
    try {
      const { data, error: err } = await supabase.rpc('create_meal_plan', {
        p_patient_id: patientId,
        p_title:      params.title,
        p_start_date: params.startDate,
        p_end_date:   params.endDate ?? undefined,
        p_notes:      params.notes ?? undefined,
      });
      if (err) return { success: false, error: err.message };
      refresh();
      return { success: true, data: { planId: data as string } };
    } catch {
      return { success: false, error: 'Erro ao criar plano' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const upsertItem = async (params: UpsertItemParams): Promise<ActionResult<{ itemId: string }>> => {
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
      if (err) return { success: false, error: err.message };
      refresh();
      return { success: true, data: { itemId: data as string } };
    } catch {
      return { success: false, error: 'Erro ao salvar item' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string): Promise<ActionResult<void>> => {
    setIsSubmitting(true);
    setItems(prev => prev.filter(i => i.itemId !== itemId));
    try {
      const { error: err } = await supabase.rpc('delete_meal_plan_item', { p_item_id: itemId });
      if (err) {
        refresh();
        return { success: false, error: err.message };
      }
      return { success: true, data: undefined };
    } catch {
      refresh();
      return { success: false, error: 'Erro ao remover item' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const logItem = async (params: LogItemParams): Promise<ActionResult<LogItemResult>> => {
    setIsSubmitting(true);
    setItems(prev => prev.map(i =>
      i.itemId === params.planItemId
        ? { ...i, logId: 'pending', actualQty: params.actualQty, actualUnit: params.actualUnit }
        : i
    ));
    try {
      const { data, error: err } = await supabase.rpc('log_meal_from_plan', {
        p_plan_item_id: params.planItemId,
        p_actual_qty:   params.actualQty,
        p_actual_unit:  params.actualUnit,
        p_actual_cal:   params.actualCal ?? undefined,
        p_notes:        params.notes ?? undefined,
      });
      if (err) {
        refresh();
        return { success: false, error: err.message };
      }
      refresh();
      const r = data as {
        log_id: string; xp_earned: number; base_xp: number;
        adherence_bonus: number; complete_day_bonus: number;
      };
      return {
        success: true,
        data: {
          xpEarned:         r.xp_earned,
          baseXp:           r.base_xp,
          adherenceBonus:   r.adherence_bonus,
          completeDayBonus: r.complete_day_bonus,
        },
      };
    } catch {
      refresh();
      return { success: false, error: 'Erro ao registrar item' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { items, plan, isLoading, error, isSubmitting, refresh, createPlan, upsertItem, deleteItem, logItem };
}
