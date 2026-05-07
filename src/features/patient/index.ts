export type { PatientProfile, PatientEvolution } from './domain/patient';
export { PatientHomeScreen } from './screens/HomeScreen';
export { PatientNutritionScreen } from './screens/NutritionScreen';
export { PatientProgressScreen } from './screens/ProgressScreen';
export { useTodayLogs } from './hooks/useTodayLogs';
export type { MealLogItem } from './hooks/useTodayLogs';
export { useProgressMetrics } from './hooks/useProgressMetrics';
export type { DailyProgressItem } from './hooks/useProgressMetrics';
