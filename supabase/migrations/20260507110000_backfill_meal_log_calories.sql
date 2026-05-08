-- ============================================================
-- Backfill calories for plan-based meal_logs with NULL calories
-- ============================================================
-- When log_meal_from_plan was called without p_actual_cal,
-- meal_logs.calories was stored as NULL. This prevents the
-- weekly calorie chart from displaying any data.
--
-- We scale the prescribed calories proportionally to the
-- quantity actually consumed vs. what was prescribed.
-- ============================================================

UPDATE public.meal_logs ml
SET
  calories   = ROUND(mpi.calories::numeric * (ml.quantity / mpi.quantity))::integer,
  updated_at = now()
FROM public.meal_plan_items mpi
WHERE ml.plan_item_id  = mpi.id
  AND ml.calories      IS NULL
  AND ml.category      = 'MEAL'
  AND ml.deleted_at    IS NULL
  AND mpi.calories     IS NOT NULL
  AND mpi.quantity     > 0;
