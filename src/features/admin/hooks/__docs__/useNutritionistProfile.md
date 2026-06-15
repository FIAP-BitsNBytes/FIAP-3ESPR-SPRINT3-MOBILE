# useNutritionistProfile

## Purpose

Fetches a single nutritionist's personal/registration data for the admin detail screen: name, CRM/CRN, approval status, email, phone, CPF, and registration date. Operational-only data (no clinical patient data).

## State and Props

- Argument: `nutritionistId: string`.
- Built on `useSupabaseQuery<NutritionistProfile | null>` — returns `{ profile, isLoading, error, refresh }`.
- `profile` defaults to `null` when `data` is `null` (no row found or not yet loaded).
- `enabled: Boolean(nutritionistId)` — no fetch/channel until an id is available.

## Dependencies

- `@/shared/infrastructure/supabase/client` — Supabase client.
- `@/shared/hooks/useSupabaseQuery` — generic fetch + realtime hook.
- `../domain/admin` — `NutritionistStatus` type.

## Data shape

- Query joins `profiles` (id, name, phone, cpf, created_at) with `nutritionist_details(crm_crn, status)`.
- `details` may return as object or single-element array; `firstDetail` normalizes both.
- `crmCrn` falls back to `'N/A'`; `status` falls back to `'PENDING'`; email/phone/cpf/memberSince fall back to `null`.
- `email` is fetched separately via `rpc('get_nutritionist_email', { p_nutritionist_id })` because the email lives in `auth.users`, not `public.profiles`. An RPC failure (e.g. forbidden) is tolerated — `email` becomes `null` and the rest of the profile still renders.

## RLS

- `profiles` is readable by any authenticated user; `nutritionist_details` is covered by the admin "manage nutritionist accounts" policy.
- Email access requires the `get_nutritionist_email` RPC (migration `20260614120000_admin_get_nutritionist_email.sql`): `SECURITY DEFINER`, restricted to an `ADMIN` caller in the same clinic as the target `NUTRITIONIST`. Raises `FORBIDDEN`/`UNAUTHORIZED` otherwise.

## Realtime and channel naming

- `channelPrefix: nutritionist-profile-<id>` passed through `uniqueChannelName`.
- Listens to `profiles` (`id=eq.<id>`) and `nutritionist_details` (`id=eq.<id>`) in a single channel.
- `deps: [nutritionistId]` — id change tears down the channel and refetches.

## Edge Cases

- Empty `nutritionistId` (`''`): `enabled` is `false`, returns `{ profile: null, isLoading: false, error: null }` with no network call.
- Missing row (`maybeSingle` returns `null`): hook returns `profile: null` without throwing.
- Refetch failure after a successful load keeps the previous `profile` and only sets `error`.
