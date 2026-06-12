# useNutritionistPatients

## Purpose

Lists a nutritionist's patients with their gamification stats (level, streak, points, experience), ordered by points descending.

## State and Props

- Argument: `nutritionistId: string`.
- Built on `useSupabaseQuery<NutritionistPatient[]>` — returns `{ patients, isLoading, error, refresh }`.
- `patients` defaults to `[]` when `data` is `null`.
- `enabled: Boolean(nutritionistId)` — no fetch/channel created until an id is available.

## Dependencies

- `@/shared/infrastructure/supabase/client` — Supabase client.
- `@/shared/hooks/useSupabaseQuery` — generic fetch + realtime hook.

## Realtime and channel naming

- `channelPrefix: \`nutritionist-patients-${nutritionistId}\`` — `useSupabaseQuery` passes this prefix to `uniqueChannelName`, producing a unique channel per instance while preserving the original `nutritionist-patients-<nutritionistId>` identifier pattern.
- Listens to `gamification_stats` filtered by `nutritionist_id=eq.<nutritionistId>`.
- `deps: [nutritionistId]` — changing the id tears down the old channel and refetches for the new id.

## Data shape

- `patient:profiles!gamification_stats_patient_id_fkey(id, name)` may come back as an object or a single-element array depending on the relation; `firstPatient` normalizes both shapes. Falls back to the literal `'Paciente'` when `name` is missing.

## Edge Cases

- Empty `nutritionistId` (`''`): `enabled` is `false`, hook returns `{ patients: [], isLoading: false, error: null }` without any network call.
- Refetch failure after a successful load keeps the previous `patients` list and only sets `error` (stale-on-refetch-failure behavior of `useSupabaseQuery`).
