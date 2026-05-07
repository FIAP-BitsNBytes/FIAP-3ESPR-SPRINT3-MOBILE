# PermissionStatsGrid

## Purpose
Displays a different stat composition for `ADMIN`, `NUTRITIONIST`, and `PATIENT` roles while reusing shared `StatCard`.

## State and Props
- Props: `role`, dashboard counts, confirmed appointment count, and schedule action handler.
- State: none.

## Dependencies
- Auth role type.
- Shared `StatCard`.
- Lucide icons and shared theme colors.

## Edge Cases
- Patient role receives a reduced view with appointment-focused metrics.
- Nutritionist role prioritizes patients and agenda.
- Admin role sees clinic-wide patient, nutritionist, appointment, and confirmation metrics.
