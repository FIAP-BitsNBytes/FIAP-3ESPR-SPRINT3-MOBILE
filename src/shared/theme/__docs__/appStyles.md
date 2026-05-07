# appStyles

## Purpose
Shared composed styles for common app surfaces: screens, cards, forms, inputs, buttons, errors, and icon badges.

## State and Props
- Stateless `StyleSheet` export.

## Dependencies
- Depends on global theme tokens from `src/shared/theme/index.ts`.

## Edge Cases
- Input frames use `surfaceHigh` on focus to keep the focused state visible in the light theme.
- Error boxes use a light red background and explicit border for contrast without overwhelming the screen.
