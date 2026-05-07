# Tabs Layout

## Purpose
Renders the authenticated app bottom menu with role-based tab visibility. The layout delegates menu permissions to `src/shared/navigation/tabs.ts` and only handles Expo Router rendering and visual tab styling.

## State and Props
- Props: none.
- State: none.
- Reads `user` and `isLoading` from `useAuthContext`.
- Passes the authenticated patient id as the initial `progress` route parameter for patient users.

## Dependencies
- Expo Router `Tabs` and `Redirect`.
- `useAuthContext` for role and authentication state.
- `getTabMenuForRole` and `getHiddenTabRoutes` for permission-based navigation.
- Lucide React Native icons mapped by semantic icon keys.
- Shared theme tokens for color, spacing, and radius.

## Edge Cases
- While auth is loading, a full-screen activity indicator is shown.
- Unauthenticated users are redirected to `/(auth)/login`.
- Routes outside a user's permission menu are hidden with `href: null`, preventing accidental tab exposure while preserving route registration.
- The tab bar avoids absolute positioning so scrollable content is not hidden behind the menu.
- Labels are intentionally short and the active state uses a small dot plus surface change to avoid clipped text.
