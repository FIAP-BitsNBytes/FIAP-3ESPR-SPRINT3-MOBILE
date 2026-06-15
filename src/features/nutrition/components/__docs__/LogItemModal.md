# LogItemModal

## Purpose
Modal for a patient to register consumption of a **planned** meal item (`log_meal_from_plan`). Captures: an optional **substitute food** (ate something other than prescribed), actual **quantity**, the **unit** consumed (selectable, defaults to the prescribed unit), real calories, an optional note, and — as proof of consumption — an optional **photo** (camera or gallery).

## Fields
- **Alimento consumido** — optional text. When filled and different from the prescribed food, the created log's `food_name` is overwritten with it (substitution). Empty → keeps the prescribed name.
- **Quantidade consumida** — numeric (accepts comma decimals); validated inline.
- **Unidade** — chip selector (`g/ml/un/porç/kcal`), defaults to `item.prescribedUnit`; sent as `actualUnit`.
- **Calorias reais** — optional; falls back to prescribed calories.
- **Observação** — optional note.
- **Foto** — optional proof.

## Reset on item change
A `useEffect` keyed on `item.itemId` resets all fields to the prescribed defaults. The component stays mounted in `NutritionScreen`, so without this the previous item's state would leak into the next.

## Layout
Fields live inside a vertical `ScrollView` (`sheet maxHeight: 90%`); title and action buttons stay fixed.

## Props
- `item: PlanItem | null` — the plan item being logged; `null` hides the modal.
- `isSubmitting: boolean` — parent mutation in flight (`usePlanMutations.logItem`).
- `onClose: () => void`.
- `onSubmit: (params: LogItemParams) => void` — receives `photoPath` (storage path) when a photo was uploaded.

## State
- `qty`, `cal`, `notes` — text inputs (qty defaults to prescribed).
- `uploading` — local flag covering the photo upload step.
- `busy = isSubmitting || uploading` — disables actions and shows spinner during upload **and** RPC.
- Photo asset via `useImagePicker` (`asset`, `status`, `pickFromCamera`, `pickFromGallery`, `clearAsset`).

## Photo flow
1. On submit, if an `asset` exists and `user.id` is known, `uploadMealPhoto(user.id, asset.uri)` runs first.
2. Success → `photoPath` set; failure → `Alert` warns and the meal is still logged **without** photo (non-blocking, proof is non-critical).
3. `onSubmit` is called with `photoPath`; `clearAsset()` resets the picker.

## Persistence
- `usePlanMutations.logItem` performs a single post-RPC `update` on `meal_logs` (`eq id = result.log_id`) setting `photo_path` and/or `food_name` (substitute) when present. `actualUnit`/`actualQty`/`actualCal`/`notes` go through the `log_meal_from_plan` RPC itself. A failed post-update does not invalidate the (already created) log. No RPC migration was needed for the substitute name — it reuses the patient's update policy on their own logs.

## Display of proof
- `get_today_plan` and `get_patient_plan_summary` now return `photo_path` (migration `20260614150000_plan_meal_photo_proof.sql`; required DROP + recreate since RETURNS TABLE columns changed).
- `PlanItem.photoPath` carries it through `usePlanQuery`.
- `MealItemRow` renders `MealPhotoThumb` (48dp) on logged patient cards when `photoPath` is present — visible to the patient and (via the editor summary) to the nutritionist.

## Dependencies
- `@/features/auth/context/AuthContext` — patient id for the storage path.
- `@/shared/hooks/useImagePicker`, `@/shared/infrastructure/supabase/storage` (`uploadMealPhoto`).

## RLS / storage
- Photos live in the `meal-photos` bucket under `<patientId>/<timestamp>.ext`.
- The `meal_logs.photo_path` update relies on the patient's existing update policy on their own logs (same as free-meal logging).

## Edge Cases
- No photo selected → `photoPath` stays `null`; plain log.
- Upload denied/failed → warned via `Alert`, log proceeds without photo.
- `busy` blocks double submits and closing mid-upload.
