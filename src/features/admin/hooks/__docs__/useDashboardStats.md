# useDashboardStats

## Purpose
Loads dashboard counters for clinic operations: patient count, nutritionist count, non-cancelled appointments for today, and pending nutritionist approvals.

## State and Props
- Arguments: none.
- Internal state: counts (`DashboardCounts`), `isLoading`, and `error` are kept in separate `useState` slots.
- Returned value is a `DashboardStats` object built with `useMemo`, keyed on `[counts, isLoading, error]` — consumers get a stable reference across renders where nothing changed.
- Uses the authenticated user's `clinicId` to scope profile counts.

## Dependencies
- Supabase client for count queries.
- `useAuthContext` for clinic scope.
- `todayIso` for local day filtering.
- `uniqueChannelName` for realtime subscription naming.

## Realtime debounce

- One channel (`admin-dashboard-<clinicId>`) listens to `profiles`, `appointments`, and `nutritionist_details`.
- Events are routed through `scheduleRefetch`, which debounces with `REALTIME_DEBOUNCE_MS = 300`. A burst of events across the three tables (e.g. one transaction touching multiple tables) triggers a single refetch instead of N.
- The debounce timer is cleared on cleanup/unmount — no phantom refetch after the hook unmounts.

## Edge Cases
- If there is no `clinicId`, loading ends with zeroed stats (initial `INITIAL_COUNTS`, untouched).
- Appointment count excludes `CANCELLED`, matching the database enum values.
- Realtime updates refetch (debounced) after changes in profiles, appointments, or nutritionist details.
