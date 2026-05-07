# tabs navigation domain

## Purpose
Defines the bottom tab menu contract for each application role. This keeps permission decisions out of the Expo Router layout and makes the menu matrix testable.

## State and Props
- Stateless exports.
- `getTabMenuForRole(role)` returns the visible ordered tabs for a role.
- `getHiddenTabRoutes(role)` returns registered routes that should not be shown in the tab bar for that role.

## Dependencies
- `UserRole` from the auth domain.

## Edge Cases
- Every role receives exactly five visible tabs to preserve bottom navigation usability.
- Visible labels are short; accessibility labels keep the full semantic destination.
- Hidden route calculation is derived from `ALL_TAB_ROUTES`, so newly registered tab routes should be added there.
- Labels are ASCII to avoid encoding drift in the current repository files.
