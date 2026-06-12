# useAuditLogs

## Purpose

Loads the 50 most recent rows from the `audit.unified_logs` table (database-level audit trail) and keeps them updated via Realtime on new inserts.

## State and Props

- Arguments: none.
- Built on `useSupabaseQuery<AuditLogEntry[]>` — returns `{ logs, isLoading, error, refresh }`.
- `logs` defaults to `[]` when `data` is `null` (initial load or failed initial load).
- `AuditLog` is re-exported as an alias of `AuditLogEntry` (from `../domain/audit`) to preserve the existing public type name used by `AuditLogsScreen`.

## Dependencies

- `@/shared/infrastructure/supabase/client` — Supabase client.
- `@/shared/hooks/useSupabaseQuery` — generic fetch + realtime hook.
- `../domain/audit` — `parseAuditLogs` / `AuditLogEntry` for runtime-safe parsing of the `audit` schema response.

## Realtime and channel naming

- `channelPrefix: 'audit-logs'` — channel name generated via `uniqueChannelName('audit-logs')` inside `useSupabaseQuery`, so every mounted instance gets a unique channel. This replaces the previous hardcoded `'audit-logs-realtime'` literal, which caused cross-instance event leakage (every mounted hook shared the same channel name and could receive each other's events / fail to clean up correctly).
- Listens for `INSERT` events on `audit.unified_logs`.

## `audit` schema typing

- The generated `database.types.ts` only covers the `public` schema. To call `.schema('audit')`, the Supabase client is cast via `(supabase as unknown as SupabaseClient)` — a narrowly-scoped, pre-existing pattern needed purely to access the untyped schema method.
- The actual row shape returned by Supabase (`unknown`) is parsed and validated by `parseAuditLogs` (see `../domain/audit.ts`), which is the **only** place in the codebase allowed to cast `unknown` → `AuditLogEntry`, via documented runtime type guards.
- Follow-up: once `npx supabase gen types --schema public,audit` is run and `database.types.ts` is regenerated, both the client cast and the `audit.ts` cast can be removed.

## Edge Cases

- If `parseAuditLogs` throws (malformed row), `useSupabaseQuery` surfaces the error via `error` and keeps the previous `logs` (stale-data-on-refetch-failure behavior of `useSupabaseQuery`).
- `refresh()` re-runs fetch and recreates the realtime channel.
