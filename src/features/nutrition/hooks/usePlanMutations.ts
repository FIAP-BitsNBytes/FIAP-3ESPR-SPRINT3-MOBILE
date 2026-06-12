import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import type {
  PlanItem,
  CreatePlanParams, UpsertItemParams, LogItemParams, LogItemResult,
  ActionResult,
} from '../types';

export interface UsePlanMutationsParams {
  items: PlanItem[];
  setItems: (items: PlanItem[]) => void;
  refresh: () => void;
  patientId?: string | null;
}

export interface UsePlanMutationsResult {
  isSubmitting: boolean;
  createPlan: (p: CreatePlanParams) => Promise<ActionResult<{ planId: string }>>;
  upsertItem: (p: UpsertItemParams) => Promise<ActionResult<{ itemId: string }>>;
  deleteItem: (itemId: string) => Promise<ActionResult<void>>;
  logItem: (p: LogItemParams) => Promise<ActionResult<LogItemResult>>;
}

/**
 * Mutações do plano alimentar (criar/editar/excluir itens, registrar refeição).
 *
 * `deleteItem` e `logItem` aplicam atualização otimista em `items` via `setItems`
 * e fazem snapshot-and-rollback: em caso de erro do RPC, `items` é restaurado ao
 * snapshot anterior (em vez de depender só de `refresh()`, que também pode falhar
 * e deixar a UI presa em um estado intermediário, ex.: `logId: 'pending'`).
 */
export function usePlanMutations({ items, setItems, refresh, patientId }: UsePlanMutationsParams): UsePlanMutationsResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const snapshot = items;
    setItems(items.filter(i => i.itemId !== itemId));
    try {
      const { error: err } = await supabase.rpc('delete_meal_plan_item', { p_item_id: itemId });
      if (err) {
        setItems(snapshot);
        return { success: false, error: err.message };
      }
      refresh();
      return { success: true, data: undefined };
    } catch {
      setItems(snapshot);
      return { success: false, error: 'Erro ao remover item' };
    } finally {
      setIsSubmitting(false);
    }
  };

  const logItem = async (params: LogItemParams): Promise<ActionResult<LogItemResult>> => {
    setIsSubmitting(true);
    const snapshot = items;
    setItems(items.map(i =>
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
        setItems(snapshot);
        return { success: false, error: err.message };
      }
      refresh();
      // Cast inline (não via interface nomeada): `Returns: Json` no RPC faz o
      // checker de overlap do TS rejeitar `Json as <interface nomeada>` mesmo
      // quando a forma é idêntica — type literal inline contorna isso.
      const result = data as {
        log_id: string; xp_earned: number; base_xp: number;
        adherence_bonus: number; complete_day_bonus: number;
      };
      return {
        success: true,
        data: {
          xpEarned:         result.xp_earned,
          baseXp:           result.base_xp,
          adherenceBonus:   result.adherence_bonus,
          completeDayBonus: result.complete_day_bonus,
        },
      };
    } catch {
      setItems(snapshot);
      return { success: false, error: 'Erro ao registrar item' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, createPlan, upsertItem, deleteItem, logItem };
}
