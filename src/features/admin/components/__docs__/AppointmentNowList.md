# AppointmentNowList

## Purpose
Renders the current appointments section body, including loading, empty, and compact appointment rows.

## State and Props
- Props: `appointments`, `isLoading`, `onAppointmentPress`.
- State: none.

## Dependencies
- `AppointmentItem` from calendar hooks.
- Lucide icons and shared theme tokens.

## Edge Cases
- Loading state displays an activity indicator.
- Empty state displays a clear message.
- The rendered list is capped to two items to keep the dashboard scannable.
