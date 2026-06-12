# MealPhotoThumb

## Purpose

Shared thumbnail component for meal-log photos stored in the Supabase `meal-photos` bucket.
Fetches a 1-hour signed URL on mount (and whenever `photoPath` changes) and renders the image;
shows a `surfaceHigh`-coloured placeholder while the URL is loading or if the fetch fails.

Used on both the patient side (`NutritionScreen` free-meal list) and the nutritionist side
(`PatientDetailScreen` / `FreeMealLogsSection`).

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `photoPath` | `string` | yes | — | Storage path returned by `uploadMealPhoto`, e.g. `"<patientId>/<timestamp>.jpg"`. |
| `size` | `number` | no | `60` | Side length in density-independent pixels. The thumbnail is always square. |

## Dependencies

- `@/shared/infrastructure/supabase/storage` — `getSignedPhotoUrl` (creates a 3600 s signed URL).
- `@/shared/theme` — `colors.surfaceHigh`, `radius.sm`.
- React Native `Image` / `View`.

## Edge Cases

1. **URL fetch failure** — `getSignedPhotoUrl` returns `null`; the placeholder remains visible.
2. **Unmount before fetch resolves** — the effect sets an `active` flag and ignores the resolved
   value, preventing state updates on an unmounted component.
3. **`photoPath` change** — the effect re-runs automatically (path in dependency array).
4. **RLS** — callers must ensure the authenticated user has `SELECT` rights on the storage object;
   the component does not handle 403 errors explicitly (placeholder stays visible).
