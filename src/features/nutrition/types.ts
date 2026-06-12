import { palette } from '@/shared/theme';

export type MealTimeType =
  | 'BREAKFAST'
  | 'MORNING_SNACK'
  | 'LUNCH'
  | 'AFTERNOON_SNACK'
  | 'DINNER'
  | 'EVENING_SNACK'
  | 'ANYTIME';

export type MeasurementUnit = 'GRAMS' | 'MILLILITERS' | 'UNITS' | 'PORTIONS' | 'CALORIES';

export interface PlanItem {
  itemId: string;
  planId: string;
  planTitle: string;
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
  adherencePct: number | null;
}

export interface PlanMeta {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  notes: string | null;
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

export interface LogItemParams {
  planItemId: string;
  actualQty: number;
  actualUnit: MeasurementUnit;
  actualCal?: number | null;
  notes?: string | null;
}

export interface LogItemResult {
  xpEarned: number;
  baseXp: number;
  adherenceBonus: number;
  completeDayBonus: number;
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export const MEAL_TIME_LABELS: Record<MealTimeType, string> = {
  BREAKFAST:       'Café da Manhã',
  MORNING_SNACK:   'Lanche da Manhã',
  LUNCH:           'Almoço',
  AFTERNOON_SNACK: 'Lanche da Tarde',
  DINNER:          'Jantar',
  EVENING_SNACK:   'Ceia',
  ANYTIME:         'A Qualquer Hora',
};

export const MEAL_TIME_ORDER: MealTimeType[] = [
  'BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK', 'ANYTIME',
];

export const MEAL_TIME_COLORS: Record<MealTimeType, string> = {
  BREAKFAST:       palette.amber,
  MORNING_SNACK:   palette.emerald,
  LUNCH:           palette.blue,
  AFTERNOON_SNACK: palette.violet,
  DINNER:          palette.pink,
  EVENING_SNACK:   palette.indigo,
  ANYTIME:         palette.slate,
};

export const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAMS:       'g',
  MILLILITERS: 'ml',
  UNITS:       'un',
  PORTIONS:    'porç.',
  CALORIES:    'kcal',
};

export const UNIT_OPTIONS: MeasurementUnit[] = ['GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES'];
