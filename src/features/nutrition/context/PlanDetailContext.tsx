import { createContext, useContext } from 'react';
import type { PlanDetailState } from '../hooks/usePlanDetail';

export const PlanDetailContext = createContext<PlanDetailState | null>(null);

export function usePlanDetailContext(): PlanDetailState {
  const ctx = useContext(PlanDetailContext);
  if (!ctx) throw new Error('usePlanDetailContext must be used inside PlanDetailContext.Provider');
  return ctx;
}
