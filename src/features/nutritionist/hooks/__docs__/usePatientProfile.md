# usePatientProfile

## Purpose

Fetches a patient's basic registration/contact data for the nutritionist's patient detail screen: name, email, phone, CPF, birth date, and registration date. Contact/operational data — not clinical (no meal logs, evolution, or plans here).

## State and Props

- Argument: `patientId: string | null`.
- Built on `useSupabaseQuery<PatientProfile | null>` — returns `{ profile, isLoading, error, refresh }`.
- `enabled: Boolean(patientId)` — no fetch/channel until an id is available.

## Dependencies

- `@/shared/infrastructure/supabase/client` — Supabase client.
- `@/shared/hooks/useSupabaseQuery` — generic fetch + realtime hook.

## Data shape

- Query joins `profiles` (id, name, phone, cpf, created_at) with `patient_details(birth_date)`.
- The embed is disambiguated as `patient_details!patient_details_id_fkey` because `patient_details` has **two** FKs to `profiles` (`id` and `nutritionist_id`); without the hint PostgREST raises an ambiguous-relationship error and the whole query fails (parent profile included).
- `details` may return as object or single-element array; `firstDetail` normalizes both.
- `email` is fetched separately via `rpc('get_patient_email', { p_patient_id })` because the email lives in `auth.users`, not `public.profiles`. An RPC failure (e.g. forbidden) is tolerated — `email` becomes `null` and the rest of the profile still renders.

## RLS

- `profiles` / `patient_details` are readable by the assigned nutritionist (per-nutritionist isolation) and by the patient themselves.
- Email access requires the `get_patient_email` RPC (migration `20260614130000_get_patient_email.sql`): `SECURITY DEFINER`, restricted to the `NUTRITIONIST` who owns the patient (`patient_details.nutritionist_id = auth.uid()`) or an `ADMIN` in the same clinic. Raises `FORBIDDEN`/`UNAUTHORIZED` otherwise. The ownership check is inlined (no dependency on the optional `is_my_patient` helper).

## Realtime and channel naming

- `channelPrefix: patient-profile-<id>`.
- Listens to `profiles` (`id=eq.<id>`) and `patient_details` (`id=eq.<id>`) in a single channel.
- `deps: [patientId]` — id change tears down the channel and refetches.

## Edge Cases

- Null/empty `patientId`: `enabled` is `false`, returns `{ profile: null, isLoading: false }` with no network call.
- Missing row (`maybeSingle` returns `null`): hook returns `profile: null` without throwing.
- `get_patient_email` denied/unavailable: `email` falls back to `null`; card shows "Não informado".
