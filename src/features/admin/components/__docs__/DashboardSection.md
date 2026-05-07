# DashboardSection

## Purpose
Reusable section wrapper for dashboard blocks with title, optional subtitle, optional count badge, and children.

## State and Props
- Props: `title`, optional `subtitle`, optional `count`, `children`.
- State: none.

## Dependencies
- React Native primitives and shared theme tokens.

## Edge Cases
- Count badge renders only when `count` is a number.
- Children are rendered directly so each section controls its own empty/loading state.
