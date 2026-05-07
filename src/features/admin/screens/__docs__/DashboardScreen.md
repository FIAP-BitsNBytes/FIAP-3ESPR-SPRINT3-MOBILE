# DashboardScreen

## Purpose
Composes the operational dashboard surface for role-aware clinic views. The screen resolves the authenticated role, loads dashboard counters and appointments, then delegates visual sections to smaller admin feature components.

## State and Props
- Props: none.
- State: no local mutable state; derived values are memoized from hooks.
- Derived data: current appointments, next appointment, confirmed appointments for the day, permission-specific quick actions.

## Dependencies
- `useAuthContext` for the current user and role.
- `useDashboardStats` for clinic-level counters.
- `useAppointments` for appointment lists filtered by role/RLS.
- Domain helpers from `src/features/admin/domain/dashboard.ts`.
- Components in `src/features/admin/components/` for header, stats, sections, appointments, quick actions, summary, and pending approvals.

## Edge Cases
- Missing user defaults the screen profile to admin copy only to avoid crashing during route hydration.
- Loading stats shows a centered activity indicator.
- Empty active appointments renders an empty state instead of a blank section.
- Pending approvals are only rendered for `ADMIN`.
