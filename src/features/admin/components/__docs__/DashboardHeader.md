# DashboardHeader

## Purpose
Role-aware dashboard header with title, subtitle, optional clinic name, and optional settings action.

## State and Props
- Props: `profile`, optional `clinicName`, optional `onSettingsPress`.
- State: none.

## Dependencies
- `PermissionDashboardProfile` from admin dashboard domain.
- Shared theme tokens and Lucide `Settings` icon.

## Edge Cases
- Settings button is omitted when no handler is provided.
- Clinic name is only prepended when available.
