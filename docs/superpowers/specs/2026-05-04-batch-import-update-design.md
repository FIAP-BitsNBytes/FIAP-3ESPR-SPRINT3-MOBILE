# Design: Batch Import Update - 2026-05-04

## Goal
Update import aliases in the codebase to reflect the recent directory restructuring where `components` and `constants` were moved to `src/shared/`.

## Scope
All files within the `src/` directory.

## Changes
1. Replace `@/components/` with `@/shared/components/`
2. Replace `@/constants/` with `@/shared/constants/`

## Files Identified
- `src/app/(tabs)/_layout.tsx`
- `src/app/(tabs)/index.tsx`
- `src/app/(tabs)/two.tsx`
- `src/app/+not-found.tsx`
- `src/app/_layout.tsx`
- `src/app/modal.tsx`
- `src/shared/components/EditScreenInfo.tsx`
- `src/shared/components/Themed.tsx`

## Methodology
- Use `grep_search` to identify exact lines.
- Use `replace` tool to update imports.
- Final verification using `grep_search`.

## Approval
Approved by user on 2026-05-04.
