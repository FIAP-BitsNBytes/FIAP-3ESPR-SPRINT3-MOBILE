# NutritionistInfoCard

## Purpose

Presentational card showing a nutritionist's personal/registration data in the admin detail screen: name, approval status badge, CRM/CRN, email, phone, CPF and registration date.

## Props

- `profile: NutritionistProfile` (from `useNutritionistProfile`). Required; the parent only renders the card when `profile` is non-null.

## Behavior

- Status badge color/icon/label resolved from `STATUS_CONFIG` (APPROVED/PENDING/REJECTED), defaulting to PENDING for unknown values.
- `formatDate` renders `memberSince` as `pt-BR` long date; invalid/empty dates render `'Não informado'`.
- Email, phone and CPF fall back to `'Não informado'` when empty/null.

## Dependencies

- `@/shared/theme` — colors, spacing, radius, fontSize.
- `lucide-react-native` — Stethoscope, BadgeCheck, Mail, Phone, IdCard, CalendarDays, status icons.
- `../hooks/useNutritionistProfile` — `NutritionistProfile` type.

## Edge Cases

- Unknown status value → falls back to PENDING styling.
- Invalid date string in `memberSince` → `'Não informado'` instead of `Invalid Date`.
