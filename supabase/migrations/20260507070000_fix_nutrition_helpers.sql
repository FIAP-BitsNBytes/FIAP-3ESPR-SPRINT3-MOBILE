-- ============================================================
-- Migration: Fix missing nutrition helper functions
-- Creates is_nutritionist() / is_patient() referenced by
-- some RLS policies, and re-applies create_meal_plan with
-- CREATE OR REPLACE so the function is guaranteed to exist.
-- ============================================================

-- ┌─────────────────────────────────────────────────────────┐
-- │ 1. Role helpers                                         │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.is_nutritionist()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role IN ('NUTRITIONIST', 'ADMIN')
     FROM public.profiles
     WHERE id = auth.uid()),
    false
  )
$$;

CREATE OR REPLACE FUNCTION public.is_patient()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role = 'PATIENT'
     FROM public.profiles
     WHERE id = auth.uid()),
    false
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_nutritionist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_patient()      TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 2. Re-ensure create_meal_plan exists (idempotent)       │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.create_meal_plan(
  p_patient_id uuid,
  p_title      text,
  p_start_date date,
  p_end_date   date DEFAULT NULL,
  p_notes      text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_clinic_id uuid;
  v_role      user_role;
  v_plan_id   uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_role, v_clinic_id
  FROM public.profiles WHERE id = v_uid;

  IF v_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_patient_id AND clinic_id = v_clinic_id AND role = 'PATIENT'
  ) THEN
    RAISE EXCEPTION 'NOT_FOUND: patient not in your clinic' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.meal_plans
  SET is_active = false, updated_at = now()
  WHERE patient_id = p_patient_id AND clinic_id = v_clinic_id AND is_active = true;

  INSERT INTO public.meal_plans (
    clinic_id, patient_id, nutritionist_id,
    title, start_date, end_date, notes
  ) VALUES (
    v_clinic_id, p_patient_id, v_uid,
    p_title, p_start_date, p_end_date, p_notes
  )
  RETURNING id INTO v_plan_id;

  RETURN v_plan_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_meal_plan(uuid, text, date, date, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.create_meal_plan(uuid, text, date, date, text) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 3. Re-ensure upsert_meal_plan_item exists               │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.upsert_meal_plan_item(
  p_plan_id   uuid,
  p_meal_time public.meal_time_type,
  p_food_name text,
  p_qty       numeric,
  p_unit      public.measurement_unit,
  p_calories  integer DEFAULT NULL,
  p_purpose   text    DEFAULT NULL,
  p_notes     text    DEFAULT NULL,
  p_sequence  integer DEFAULT 0,
  p_item_id   uuid    DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_clinic_id uuid;
  v_role      user_role;
  v_item_id   uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_role, v_clinic_id
  FROM public.profiles WHERE id = v_uid;

  IF v_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF trim(p_food_name) = '' THEN
    RAISE EXCEPTION 'INVALID: food_name required' USING ERRCODE = 'P0002';
  END IF;

  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'INVALID: qty must be > 0' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.meal_plans WHERE id = p_plan_id AND clinic_id = v_clinic_id
  ) THEN
    RAISE EXCEPTION 'NOT_FOUND: plan not in your clinic' USING ERRCODE = 'P0002';
  END IF;

  IF p_item_id IS NOT NULL THEN
    UPDATE public.meal_plan_items
    SET meal_time  = p_meal_time,
        food_name  = trim(p_food_name),
        quantity   = p_qty,
        unit       = p_unit,
        calories   = p_calories,
        purpose    = p_purpose,
        notes      = p_notes,
        sequence   = p_sequence,
        updated_at = now()
    WHERE id = p_item_id AND plan_id = p_plan_id
    RETURNING id INTO v_item_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'NOT_FOUND: item not in this plan' USING ERRCODE = 'P0002';
    END IF;
  ELSE
    INSERT INTO public.meal_plan_items (
      plan_id, meal_time, food_name,
      quantity, unit, calories, purpose, notes, sequence
    ) VALUES (
      p_plan_id, p_meal_time, trim(p_food_name),
      p_qty, p_unit, p_calories, p_purpose, p_notes, p_sequence
    )
    RETURNING id INTO v_item_id;
  END IF;

  RETURN v_item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_meal_plan_item(uuid, public.meal_time_type, text, numeric, public.measurement_unit, integer, text, text, integer, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.upsert_meal_plan_item(uuid, public.meal_time_type, text, numeric, public.measurement_unit, integer, text, text, integer, uuid) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 4. Re-ensure delete_meal_plan_item exists               │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.delete_meal_plan_item(
  p_item_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_clinic_id uuid;
  v_role      user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_role, v_clinic_id
  FROM public.profiles WHERE id = v_uid;

  IF v_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.meal_plan_items mpi
  SET is_active  = false,
      updated_at = now()
  FROM public.meal_plans mp
  WHERE mpi.id       = p_item_id
    AND mpi.plan_id  = mp.id
    AND mp.clinic_id = v_clinic_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_meal_plan_item(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.delete_meal_plan_item(uuid) TO authenticated;
