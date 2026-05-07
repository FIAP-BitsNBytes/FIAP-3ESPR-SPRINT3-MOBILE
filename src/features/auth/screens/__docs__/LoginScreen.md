# LoginScreen

## Purpose
Authentication entry screen for NutriApp. It collects email and password, delegates authentication to `useAuthContext().login`, and redirects authenticated users to the tab shell.

## State and Props
- Local state: `email`, `password`, `focusedField`, `error`, `isLoading`.
- Props: none.
- Navigation: uses Expo Router to replace the current route with `/(tabs)` after successful login.

## Dependencies
- `useAuthContext` for the login action.
- `appStyles` from `src/shared/theme/appStyles.ts` for shared screen, card, field, button, and feedback styles.
- `colors`, `spacing`, `radius`, `fontSize`, and `shadow` from the shared theme tokens.
- Lucide React Native icons for consistent vector iconography.

## Edge Cases
- Empty email or password shows inline validation without calling Supabase.
- Failed authentication shows an inline error alert.
- Loading state disables the primary button and replaces text with an activity indicator.
- The layout uses a scroll view and keyboard avoiding view so compact screens can still reach every field.
