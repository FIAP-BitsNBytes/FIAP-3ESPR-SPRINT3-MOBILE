# useNutritionistAppointments

## Purpose

Lists a nutritionist's sessions (appointments) for the admin detail screen, with patient name, scheduled date/time, status and type. Ordered most-recent first. Operational data (the schedule), not clinical.

## State and Props

- Argument: `nutritionistId: string`.
- Built on `useSupabaseQuery<NutritionistAppointment[]>` — returns `{ appointments, isLoading, error, refresh }`.
- `appointments` defaults to `[]` when `data` is `null`.
- `enabled: Boolean(nutritionistId)` — no fetch/channel until an id is available.

## Dependencies

- `@/shared/infrastructure/supabase/client` — Supabase client.
- `@/shared/hooks/useSupabaseQuery` — generic fetch + realtime hook.

## Data shape

- Query: `appointments(id, patient_id, scheduled_at, status, type)` joined with `profiles!appointments_patient_id_fkey(id, name)`.
- `patient` may return as object or single-element array; `firstPatient` normalizes both. Falls back to `'Paciente'` when `name` is missing.

## RLS

- Covered by the `admins_view_clinic_appointments` policy (admin SELECT on appointments scoped to their clinic) plus `profiles` readable by authenticated. No migration required.

## Realtime and channel naming

- `channelPrefix: nutritionist-appointments-<id>` passed through `uniqueChannelName`.
- Listens to `appointments` filtered by `nutritionist_id=eq.<id>`.
- `deps: [nutritionistId]` — id change tears down the channel and refetches.

## Edge Cases

- Empty `nutritionistId` (`''`): `enabled` is `false`, returns `{ appointments: [], isLoading: false, error: null }` with no network call.
- Refetch failure after a successful load keeps the previous list and only sets `error`.
