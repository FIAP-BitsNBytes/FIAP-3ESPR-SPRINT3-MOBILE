# dashboard domain

## Purpose
Pure dashboard rules for permission-specific copy and appointment derivations. This keeps time-window and role-copy logic out of React components.

## State and Props
- Stateless pure functions.
- Inputs are `UserRole`, `AppointmentItem[]`, current `Date`, and optional appointment duration.

## Dependencies
- `UserRole` from auth domain.
- `AppointmentItem` from calendar hook type.

## Edge Cases
- Cancelled appointments are never considered active or next.
- Active appointment checks use a configurable duration window, defaulting to 60 minutes.
- Permission profile copy covers all three roles: `ADMIN`, `NUTRITIONIST`, and `PATIENT`.
