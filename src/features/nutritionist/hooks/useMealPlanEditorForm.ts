import { useState } from 'react';
import type { MealTimeType } from '@/features/nutrition';
import type { CreatePlanParams, NutritionistPlanItem, UpsertItemParams } from './useMealPlan';
import type { CreatePlanForm } from '../components/meal-plan-editor';

interface UseMealPlanEditorFormParams {
  createPlan: (params: CreatePlanParams) => Promise<{ success: true; planId: string } | { success: false; error: string }>;
  upsertItem: (params: UpsertItemParams) => Promise<{ success: true; itemId: string } | { success: false; error: string }>;
}

interface UseMealPlanEditorFormReturn {
  showCreatePlan: boolean;
  showItemModal: boolean;
  editItem: NutritionistPlanItem | null;
  defaultMealTime: MealTimeType;
  openCreatePlan: () => void;
  closeCreatePlan: () => void;
  openAddItem: (mealTime?: MealTimeType) => void;
  openEditItem: (item: NutritionistPlanItem) => void;
  closeItemModal: () => void;
  handleCreatePlan: (form: CreatePlanForm) => Promise<void>;
  handleUpsertItem: (params: UpsertItemParams) => Promise<void>;
}

/**
 * Owns the modal-orchestration state for `MealPlanEditorScreen`:
 * which modal is open, which item is being edited, and the default
 * meal time for new items. Wraps `createPlan` / `upsertItem` so the
 * relevant modal closes automatically on success.
 */
export function useMealPlanEditorForm({
  createPlan, upsertItem,
}: UseMealPlanEditorFormParams): UseMealPlanEditorFormReturn {
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editItem, setEditItem] = useState<NutritionistPlanItem | null>(null);
  const [defaultMealTime, setDefaultMealTime] = useState<MealTimeType>('BREAKFAST');

  const openCreatePlan = () => setShowCreatePlan(true);
  const closeCreatePlan = () => setShowCreatePlan(false);

  const openAddItem = (mealTime: MealTimeType = 'BREAKFAST') => {
    setDefaultMealTime(mealTime);
    setEditItem(null);
    setShowItemModal(true);
  };

  const openEditItem = (item: NutritionistPlanItem) => {
    setEditItem(item);
    setShowItemModal(true);
  };

  const closeItemModal = () => {
    setShowItemModal(false);
    setEditItem(null);
  };

  const handleCreatePlan = async (form: CreatePlanForm) => {
    const result = await createPlan({
      title: form.title,
      startDate: form.startDate,
      endDate: form.endDate || null,
      notes: form.notes || null,
    });
    if (result.success) closeCreatePlan();
  };

  const handleUpsertItem = async (params: UpsertItemParams) => {
    const result = await upsertItem(params);
    if (result.success) closeItemModal();
  };

  return {
    showCreatePlan,
    showItemModal,
    editItem,
    defaultMealTime,
    openCreatePlan,
    closeCreatePlan,
    openAddItem,
    openEditItem,
    closeItemModal,
    handleCreatePlan,
    handleUpsertItem,
  };
}
