# NutritionistPatientsScreen

## Purpose

Admin detail screen reached by tapping a nutritionist in `NutritionistsScreen`. Shows, for the selected nutritionist:

1. **Informações Pessoais** — personal/registration card (`NutritionistInfoCard`).
2. **Pacientes em Sessões** — list of appointments/sessions (`NutritionistSessionRow`).
3. **Ranking de Pacientes** — existing gamification ranking of linked patients.

## State and Props

- Route params: `{ id, name }` via `useLocalSearchParams`.
- Hooks:
  - `useNutritionistPatients(id)` — `{ patients, isLoading, error, refresh }` (ranking).
  - `useNutritionistProfile(id)` — `{ profile, isLoading, refresh }` (personal info).
  - `useNutritionistAppointments(id)` — `{ appointments, isLoading, refresh }` (sessions).
- `handleRefresh` pull-to-refresh fans out to all three `refresh` callbacks; `refreshing` is the OR of the three loading flags.

## Layout

- The ranking `FlatList` renders the personal info card and sessions section inside `ListHeaderComponent`, so the whole detail scrolls as one list (avoids nested scroll views).
- Sessions and personal info each show an inline `ActivityIndicator` while loading and an empty state when there is no data.

## Dependencies

- `../hooks/useNutritionistProfile`, `../hooks/useNutritionistAppointments`, `../hooks/useNutritionistPatients`.
- `../components/NutritionistInfoCard`, `../components/NutritionistSessionRow`.
- `@/shared/theme`, `expo-router`, `lucide-react-native`.

## RLS / privacy

- All three hooks read operational/profile data only. Appointments rely on the `admins_view_clinic_appointments` policy (clinic-scoped). No clinical (meal/evolution) data is surfaced to the admin, per the project privacy mandate.

## Edge Cases

- Empty `id`: every hook is disabled and renders empty states without network calls.
- Missing profile row → personal info section renders nothing once loading settles.
- No appointments → "Nenhuma sessão agendada" empty card.
- Refetch failures keep stale data and surface only `error` (behavior inherited from `useSupabaseQuery`).
