# PatientInfoCard

## Purpose

Presentational card showing a patient's basic registration/contact data at the top of the nutritionist's patient detail screen: name, email, phone, CPF, birth date (with computed age), and registration date.

## Props

- `profile: PatientProfile` (from `usePatientProfile`). Required; the parent only renders the card when `profile` is non-null.

## Behavior

- `formatDate` renders dates as `pt-BR` long date; invalid/empty dates render `'Não informado'`.
- `computeAge` derives age in years from `birthDate`; `formatBirth` appends `(N anos)` when available.
- Email, phone and CPF fall back to `'Não informado'` when empty/null.

## Dependencies

- `@/shared/theme` — colors, spacing, radius, fontSize.
- `lucide-react-native` — User, Mail, Phone, IdCard, Cake, CalendarDays.
- `../../hooks/usePatientProfile` — `PatientProfile` type.

## Edge Cases

- Invalid/empty `birthDate` → `'Não informado'`, no age suffix.
- Future birth date → age suppressed (negative age treated as null).
