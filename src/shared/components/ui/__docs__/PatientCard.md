# PatientCard

## Purpose
Reusable compact patient summary row for nutritionist/admin views.

## State and Props
- Props: `name`, `level`, `streakDays`, `points`, optional `onPress`.
- Internal animation state: press scale via Reanimated shared value.

## Dependencies
- Shared theme tokens.
- Lucide icons for streak, level, and navigation affordance.

## Edge Cases
- Initials are derived from the first two words in the patient name.
- Long names are constrained to one line.
