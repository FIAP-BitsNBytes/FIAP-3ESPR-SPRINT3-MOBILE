import { useState, useEffect } from 'react';
import { usePlanQuery } from './usePlanQuery';
import { usePlanMutations } from './usePlanMutations';
import type {
  PlanItem, PlanMeta,
  CreatePlanParams, UpsertItemParams, LogItemParams, LogItemResult,
  ActionResult,
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

/**
 * Facade: combina busca (`usePlanQuery`) e mutações (`usePlanMutations`) do
 * plano alimentar, mantendo a mesma forma de `PlanDetailState` consumida por
 * `PlanDetailContext` e telas de nutrição.
 */
export function usePlanDetail(patientId?: string | null, date?: string): PlanDetailState {
  const query = usePlanQuery(patientId, date);
  const [items, setItems] = useState<PlanItem[]>(query.items);

  useEffect(() => {
    setItems(query.items);
  }, [query.items]);

  const mutations = usePlanMutations({
    items,
    setItems,
    refresh: query.refresh,
    patientId,
  });

  return {
    items,
    plan: query.plan,
    isLoading: query.isLoading,
    error: query.error,
    isSubmitting: mutations.isSubmitting,
    refresh: query.refresh,
    createPlan: mutations.createPlan,
    upsertItem: mutations.upsertItem,
    deleteItem: mutations.deleteItem,
    logItem: mutations.logItem,
  };
}
