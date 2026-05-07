# StatCard

## Purpose
Reusable dashboard metric card with icon, value, label, optional color override, and optional press action.

## State and Props
- Props: `label`, `value`, `Icon`, optional `color`, optional `onPress`.
- Internal animation state: press scale via Reanimated shared value.

## Dependencies
- Lucide icon type.
- Shared theme tokens.
- React Native Reanimated for press feedback.

## Edge Cases
- If `onPress` is omitted the visual remains the same, but the component still uses a `Pressable`; callers should pass `onPress` for actionable cards.
- Color override should maintain readable contrast against white surfaces.
