# AppointmentCard

## Purpose
Reusable appointment summary card with date/time, status badge, patient/nutritionist names, and optional type.

## State and Props
- Props: `patientName`, `nutritionistName`, `scheduledAt`, `status`, optional `type`, optional `onPress`.
- Internal animation state: press scale via Reanimated shared value.

## Dependencies
- Shared theme tokens.
- Lucide icons.

## Edge Cases
- Status color and label are mapped from `PENDING`, `CONFIRMED`, and `CANCELLED`.
- Patient or nutritionist rows are omitted when the respective name is not provided.
