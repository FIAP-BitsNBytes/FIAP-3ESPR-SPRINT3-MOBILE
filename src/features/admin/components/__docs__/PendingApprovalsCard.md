# PendingApprovalsCard

## Purpose
Highlights pending nutritionist approvals for admin users.

## State and Props
- Props: `count`, `onPress`.
- State: none.

## Dependencies
- Lucide icons and shared theme tokens.

## Edge Cases
- Renders `null` when `count <= 0`.
- Singular/plural label changes based on count.
