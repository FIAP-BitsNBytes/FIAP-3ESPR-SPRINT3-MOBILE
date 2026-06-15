# NutritionistSessionRow

## Purpose

Presentational row for a single nutritionist session (appointment) in the admin detail screen: patient name, scheduled date/time, optional type, and a status badge.

## Props

- `appointment: NutritionistAppointment` (from `useNutritionistAppointments`). Required.

## Behavior

- Status badge color/icon/label resolved from `STATUS_CONFIG` (CONFIRMED/PENDING/CANCELLED), defaulting to PENDING for unknown values.
- `formatDateTime` renders `scheduledAt` as `pt-BR` date + time; invalid dates render `'Data inválida'`.
- `type` line is only rendered when present.

## Dependencies

- `@/shared/theme` — colors, spacing, radius, fontSize.
- `lucide-react-native` — CalendarClock, User, status icons.
- `../hooks/useNutritionistAppointments` — `NutritionistAppointment` / `AppointmentStatus` types.

## Edge Cases

- Unknown status value → falls back to PENDING styling.
- Invalid `scheduledAt` → `'Data inválida'`.
- Null `type` → type line omitted.
