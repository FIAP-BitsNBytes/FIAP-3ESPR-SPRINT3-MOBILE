# Root Layout (`src/app/_layout.tsx`)

## Purpose
The root layout of the NutriApp application. It handles global providers, font loading, and splash screen management.

## State/Props
- `loaded`: Boolean state from `useFonts` indicating if custom fonts (SpaceMono) are ready.
- `error`: Error state from `useFonts` if font loading fails.
- `colorScheme`: Theme preference (light/dark) retrieved from `useColorScheme`.

## Dependencies
- `expo-font`: For loading custom typography.
- `expo-router`: For stack navigation and error boundaries.
- `expo-splash-screen`: To manage the app's initial appearance.
- `@react-navigation/native`: For theme providing.

## Edge Cases
- **Font Loading Failure:** If fonts fail to load, an error is thrown to be caught by the Expo Router Error Boundary.
- **Splash Screen:** The splash screen is prevented from auto-hiding and only hidden once fonts are successfully loaded.
- **Path Resolution:** Assets outside the `src` folder (like `assets/fonts`) must be referenced using relative paths from the file location (e.g., `../../assets/`).
