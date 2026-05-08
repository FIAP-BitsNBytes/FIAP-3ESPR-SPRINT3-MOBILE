-- ============================================================
-- Migration: Drop duplicate create_meal_plan overloads
-- Remote migrations created an extended signature with extra
-- params (p_protein_goal_g, p_restrictions). PostgREST cannot
-- resolve the ambiguity (PGRST203). Drop all overloads and
-- re-create a single canonical version.
-- ============================================================

-- Drop every known overload (safe to run multiple times)
DROP FUNCTION IF EXISTS public.create_meal_plan(uuid, text, date, date, text);
DROP FUNCTION IF EXISTS public.create_meal_plan(uuid, text, date, date, text, integer, text);
DROP FUNCTION IF EXISTS public.create_meal_plan(uuid, text, date);
DROP FUNCTION IF EXISTS public.create_meal_plan(uuid, text, date, date);

-- Re-create canonical version
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
