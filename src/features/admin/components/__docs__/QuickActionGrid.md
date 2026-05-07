# QuickActionGrid

## Purpose
Reusable quick-action list for dashboard navigation shortcuts.

## State and Props
- Props: `actions`, where each action includes label, description, icon, color, and press handler.
- State: none.

## Dependencies
- Lucide icon type and shared theme tokens.

## Edge Cases
- Actions are keyed by label, so labels should be unique within a grid.
- Each item exposes an accessibility label matching the visible label.
