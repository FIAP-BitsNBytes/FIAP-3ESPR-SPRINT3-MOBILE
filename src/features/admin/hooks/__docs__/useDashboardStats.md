# useDashboardStats

## Purpose
Loads dashboard counters for clinic operations: patient count, nutritionist count, non-cancelled appointments for today, and pending nutritionist approvals.

## State and Props
- Arguments: none.
- Internal state: `DashboardStats` with counts, loading flag, and error message.
- Uses the authenticated user's `clinicId` to scope profile counts.

## Dependencies
- Supabase client for count queries.
- `useAuthContext` for clinic scope.
- `todayIso` for local day filtering.
- `uniqueChannelName` for realtime subscription naming.

## Edge Cases
- If there is no `clinicId`, loading ends with zeroed stats.
- Appointment count excludes `CANCELLED`, matching the database enum values.
- Realtime updates refetch after changes in profiles, appointments, or nutritionist details.
