# useClinicManagement

## Purpose

Loads and updates the current admin's clinic record (`name`, `phone`), with realtime sync.

## State and Props

- Arguments: none.
- Internal state (`UseClinicManagementState`): `clinic`, `isLoading`, `isSaving`, `error`.
- Returns `{ clinic, isLoading, isSaving, error, updateClinic, refresh }`.

## Dependencies

- Supabase client for `clinics` table read/update.
- `useAuthContext` for `clinicId`.
- `uniqueChannelName` for realtime channel naming (`clinic-mgmt-<clinicId>`).

## `updateClinic`

- Sets `isSaving: true` and clears `error` before the mutation.
- Wrapped in `try/catch/finally`:
  - On Supabase error response (`{ error }`), sets `error` to the message.
  - On thrown/rejected promise (e.g. network failure), sets `error` to the caught message.
  - On success, merges `updates` into `clinic` immutably.
  - **`finally` always resets `isSaving` to `false`**, regardless of which path was taken — previously, an exception path (vs. an `{ error }` response) could leave `isSaving` stuck at `true`.

## Realtime

- One channel (`clinic-mgmt-<clinicId>`) listens to `clinics` filtered by `id=eq.<clinicId>` and refetches on change.

## Edge Cases

- No `clinicId`: fetch sets `error: 'Não foi possível encontrar sua clínica.'` and `isLoading: false`.
- `updateClinic` is a no-op if `clinic` hasn't loaded yet (`state.clinic?.id` is falsy).
