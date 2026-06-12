# Theme Tokens

## Purpose
Global design tokens for NutriApp. The current direction is an accessible clinical light system: cyan health brand color, white surfaces, high-contrast text, and softer shadows.

## State and Props
- Stateless exported constants: `colors`, `palette`, `spacing`, `radius`, `fontSize`, `shadow`, `timing`.
- `palette` holds cross-feature accent colors (amber, emerald, blue, violet, pink, indigo, slate, silver, bronze, pulse) used by features like nutrition (`MEAL_TIME_COLORS`).
- `colors.waterAccent` complements `colors.water` for hydration UI highlights.

## Dependencies
- Used by screens, shared components, navigation, and `appStyles`.

## Edge Cases
- `colors.onPrimary` should be used for text/icons on primary buttons instead of `colors.background`.
- Some legacy screens still contain raw colors and should be migrated incrementally.
