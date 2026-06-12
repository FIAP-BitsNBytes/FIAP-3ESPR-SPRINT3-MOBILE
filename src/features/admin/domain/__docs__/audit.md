# audit domain

## Purpose

Runtime parsing and validation of rows from the `audit.unified_logs` table. This is the single, documented boundary where data from the untyped `audit` schema is narrowed from `unknown` into the typed `AuditLogEntry` shape used by `useAuditLogs` and `AuditLogsScreen`.

## State and Props

- Stateless pure functions: `parseAuditLog(row: unknown): AuditLogEntry` and `parseAuditLogs(rows: unknown): AuditLogEntry[]`.
- `AuditLogEntry` fields: `id`, `executed_at`, `table_name`, `action` (`'INSERT' | 'UPDATE' | 'DELETE'`), `actor_role`, `old_data` (`Record<string, unknown> | null`), `new_data` (`Record<string, unknown> | null`).

## Dependencies

- None (no external imports). Pure type guards (`isPlainObject`, `isNonEmptyString`, `isAuditAction`, `isJsonDataOrNull`).

## `as unknown` policy

- The generated `database.types.ts` only covers the `public` schema; the `audit` schema (and therefore `audit.unified_logs`'s row shape) isn't represented in generated types yet.
- Follow-up: `npx supabase gen types --schema public,audit` should be run to add proper typing, after which `parseAuditLog`'s runtime checks can be reduced to plain validation (or removed if the generated types are trusted as-is).
- Until then, this file is the **only** place in the codebase allowed to treat a Supabase response row as `unknown` and narrow it via runtime checks into a domain type. `useAuditLogs.ts` calls `parseAuditLogs(rows)` immediately after the query — no other file casts `audit` rows.

## Edge Cases / Decision

- **Throws on invalid input** (documented, consistent behavior): `parseAuditLog` throws an `Error` with a specific message identifying the missing/invalid field when:
  - `row` is not a plain object (including `null`, arrays, primitives).
  - `id`, `executed_at`, `table_name`, or `actor_role` is missing, not a string, or an empty string.
  - `action` is missing or not one of `'INSERT' | 'UPDATE' | 'DELETE'`.
  - `old_data` / `new_data` is present but not an object and not `null` (e.g. a string, number, or array).
- `parseAuditLogs` throws if the input isn't an array, or if any element fails `parseAuditLog` (the whole batch fails — no partial/best-effort results).
- Rationale: a malformed audit row indicates a schema/migration drift issue. Failing loudly surfaces this via `useSupabaseQuery`'s `error` state (which preserves stale `logs` on refetch failure) rather than silently dropping or masking rows.
