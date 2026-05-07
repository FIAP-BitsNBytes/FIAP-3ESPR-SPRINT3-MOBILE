# Theme Tokens

## Purpose
Global design tokens for NutriApp. The current direction is an accessible clinical light system: cyan health brand color, white surfaces, high-contrast text, and softer shadows.

## State and Props
- Stateless exported constants: `colors`, `spacing`, `radius`, `fontSize`, `shadow`, `timing`.

## Dependencies
- Used by screens, shared components, navigation, and `appStyles`.

## Edge Cases
- `colors.onPrimary` should be used for text/icons on primary buttons instead of `colors.background`.
- Some legacy screens still contain raw colors and should be migrated incrementally.
