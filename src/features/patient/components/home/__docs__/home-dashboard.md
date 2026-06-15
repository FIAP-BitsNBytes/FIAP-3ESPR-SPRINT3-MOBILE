# Patient Home Dashboard Components

Components rendered by `PatientHomeScreen` (`src/features/patient/screens/HomeScreen.tsx`) to make the patient dashboard actionable.

## QuickActions

### Purpose
2×2 grid of quick-action tiles at the top of the dashboard. Highlights "Registrar refeição" as the primary action.

### Props
- `onRegisterMeal: () => void` — opens the inline `FreeMealModal`.
- `onAddWater: () => void` — logs a fixed `+250ml` immediately.
- `onOpenPlan: () => void` — navigates to the nutrition tab.
- `onOpenSchedule: () => void` — navigates to the schedule tab.
- `waterLoading?: boolean` — shows a spinner on the water tile while the RPC runs.

### Notes
- Highlighted tile uses `colors.primary`; others use a tinted icon badge.
- Press animation via Reanimated shared value (scale 0.96).

## NextMealCard

### Purpose
Shows the next unlogged plan item for today. Three states: pending item, all logged (`Plano completo`), or no plan (`Sem plano para hoje`).

### Props
- `nextItem: PlanItem | null` — next unlogged item, or null.
- `hasPlan: boolean` — distinguishes "all done" from "no plan at all".
- `onPress: () => void` — navigates to the nutrition tab.

### Dependencies
- `MEAL_TIME_LABELS`, `UNIT_LABELS` from `@/features/nutrition`.
- `PlanItem` from `../../hooks/useDailyPlan`.

### Edge Cases
- `hasPlan === false` → CTA card pointing to free logging.
- `hasPlan === true && nextItem === null` → success/completed card (non-pressable).

## NextAppointmentCard

### Purpose
Shows the patient's next future, non-cancelled appointment. Returns `null` when there is none (parent renders nothing).

### Props
- `appointment: AppointmentItem | null` — from `useAppointments`.
- `onPress: () => void` — navigates to the schedule tab.

### Notes
- `formatWhen` renders `"qua, 18 jun · 14:30"` using local `pt-BR` formatting (no shared datetime util exists yet).

## Data flow (HomeScreen)
- `useDailyPlan()` → sorted by `MEAL_TIME_ORDER` then `sequence`; first `isUnlogged` item feeds `NextMealCard`.
- `useAppointments()` (ascending) → first future, status `!== 'CANCELLED'` feeds `NextAppointmentCard`.
- `useLogWater()` / `useLogMeal()` drive quick actions; errors surface via `Alert`.
- All sources are realtime (publication enabled in migration `20260614140000_enable_realtime_publication.sql`), so the dashboard updates without reload.
