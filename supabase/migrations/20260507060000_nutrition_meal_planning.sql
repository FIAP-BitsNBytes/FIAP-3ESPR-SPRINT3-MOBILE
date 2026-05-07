-- ============================================================
-- Migration: Nutrition & Meal Planning System
-- ============================================================
-- Creates meal_plans and meal_plan_items tables, alters
-- meal_logs (nutritionist_id nullable, adds plan_item_id /
-- xp_earned / notes), and installs SECURITY DEFINER functions
-- that perform all XP calculations server-side.
-- ============================================================

-- ┌─────────────────────────────────────────────────────────┐
-- │ 1. Enum: meal timing                                    │
-- └─────────────────────────────────────────────────────────┘

DO $$ BEGIN
  CREATE TYPE public.meal_time_type AS ENUM (
    'BREAKFAST',
    'MORNING_SNACK',
    'LUNCH',
    'AFTERNOON_SNACK',
    'DINNER',
    'EVENING_SNACK',
    'ANYTIME'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 2. meal_plans: nutritionist → patient prescription      │
-- └─────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.meal_plans (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       uuid        NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nutritionist_id uuid        NOT NULL REFERENCES public.profiles(id),
  title           text        NOT NULL,
  start_date      date        NOT NULL,
  end_date        date,
  notes           text,
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────┐
-- │ 3. meal_plan_items: individual prescribed items         │
-- └─────────────────────────────────────────────────────────┘

CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id           uuid                    PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      uuid                    NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  meal_time    public.meal_time_type   NOT NULL DEFAULT 'ANYTIME',
  food_name    text                    NOT NULL,
  quantity     numeric                 NOT NULL CHECK (quantity > 0),
  unit         public.measurement_unit NOT NULL,
  calories     integer,
  purpose      text,
  notes        text,
  sequence     integer                 NOT NULL DEFAULT 0,
  is_active    boolean                 NOT NULL DEFAULT true,
  created_at   timestamptz             NOT NULL DEFAULT now(),
  updated_at   timestamptz             NOT NULL DEFAULT now()
);

-- ┌─────────────────────────────────────────────────────────┐
-- │ 4. Alter meal_logs                                      │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE public.meal_logs
  ALTER COLUMN nutritionist_id DROP NOT NULL;

ALTER TABLE public.meal_logs
  ADD COLUMN IF NOT EXISTS plan_item_id uuid        REFERENCES public.meal_plan_items(id),
  ADD COLUMN IF NOT EXISTS xp_earned    integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes        text;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 5. Indexes                                              │
-- └─────────────────────────────────────────────────────────┘

CREATE INDEX IF NOT EXISTS idx_meal_plans_patient
  ON public.meal_plans(patient_id, is_active, start_date);

CREATE INDEX IF NOT EXISTS idx_meal_plans_clinic
  ON public.meal_plans(clinic_id, is_active);

CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan
  ON public.meal_plan_items(plan_id, is_active, sequence);

CREATE INDEX IF NOT EXISTS idx_meal_logs_plan_item
  ON public.meal_logs(plan_item_id)
  WHERE plan_item_id IS NOT NULL;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 6. RLS: meal_plans                                      │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plans: patient read own"
  ON public.meal_plans FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "meal_plans: nutritionist full"
  ON public.meal_plans FOR ALL
  TO authenticated
  USING (
    clinic_id IN (
      SELECT clinic_id FROM public.profiles
      WHERE id = auth.uid() AND role IN ('NUTRITIONIST', 'ADMIN')
    )
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │ 7. RLS: meal_plan_items                                 │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE public.meal_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meal_plan_items: patient read own"
  ON public.meal_plan_items FOR SELECT
  TO authenticated
  USING (
    plan_id IN (
      SELECT id FROM public.meal_plans WHERE patient_id = auth.uid()
    )
  );

CREATE POLICY "meal_plan_items: nutritionist full"
  ON public.meal_plan_items FOR ALL
  TO authenticated
  USING (
    plan_id IN (
      SELECT mp.id FROM public.meal_plans mp
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE p.role IN ('NUTRITIONIST', 'ADMIN') AND p.clinic_id = mp.clinic_id
    )
  );

-- ┌─────────────────────────────────────────────────────────┐
-- │ 8. FUNCTION: log_water_intake (patient)                 │
-- │   XP: 500 pts at 2500ml; +100 per extra 500ml; cap 1000│
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.log_water_intake(
  p_amount_ml integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_clinic_id uuid;
  v_role      user_role;
  v_log_id    uuid;
  v_today     date := CURRENT_DATE;
  v_prev_ml   numeric;
  v_new_ml    numeric;
  v_prev_xp   integer;
  v_new_xp    integer;
  v_earned    integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_role, v_clinic_id
  FROM public.profiles WHERE id = v_uid;

  IF v_role != 'PATIENT' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF p_amount_ml <= 0 OR p_amount_ml > 5000 THEN
    RAISE EXCEPTION 'INVALID: amount_ml must be 1-5000' USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(SUM(quantity), 0) INTO v_prev_ml
  FROM public.meal_logs
  WHERE patient_id = v_uid
    AND category = 'WATER'
    AND unit = 'MILLILITERS'
    AND logged_at::date = v_today
    AND deleted_at IS NULL;

  v_new_ml := v_prev_ml + p_amount_ml;

  v_prev_xp := CASE
    WHEN v_prev_ml < 2500 THEN 0
    ELSE LEAST(500 + (FLOOR((v_prev_ml - 2500) / 500) * 100)::integer, 1000)
  END;
  v_new_xp := CASE
    WHEN v_new_ml < 2500 THEN 0
    ELSE LEAST(500 + (FLOOR((v_new_ml - 2500) / 500) * 100)::integer, 1000)
  END;
  v_earned := v_new_xp - v_prev_xp;

  INSERT INTO public.meal_logs (
    patient_id, clinic_id, food_name,
    category, quantity, unit, xp_earned, logged_at,
    created_by, updated_by
  ) VALUES (
    v_uid, v_clinic_id, 'Agua',
    'WATER', p_amount_ml, 'MILLILITERS', v_earned, now(),
    v_uid, v_uid
  )
  RETURNING id INTO v_log_id;

  IF v_earned > 0 THEN
    UPDATE public.gamification_stats
    SET experience = experience + v_earned,
        points     = points     + v_earned,
        level      = LEAST(FLOOR((experience + v_earned) / 500.0)::integer + 1, 100),
        updated_at = now(),
        updated_by = v_uid
    WHERE patient_id = v_uid;
  END IF;

  RETURN jsonb_build_object(
    'log_id',    v_log_id,
    'xp_earned', v_earned,
    'total_ml',  v_new_ml
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_water_intake(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_water_intake(integer) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 9. FUNCTION: log_meal_from_plan (patient)               │
-- │   XP: ceil(1000/total) + 75 adherence + 200 full-day   │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.log_meal_from_plan(
  p_plan_item_id  uuid,
  p_actual_qty    numeric,
  p_actual_unit   public.measurement_unit,
  p_actual_cal    integer DEFAULT NULL,
  p_notes         text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid             uuid := auth.uid();
  v_clinic_id       uuid;
  v_role            user_role;
  v_log_id          uuid;
  v_today           date := CURRENT_DATE;
  v_item            record;
  v_total_items     integer;
  v_logged_count    integer;
  v_base_xp         integer;
  v_adherence_bonus integer := 0;
  v_complete_bonus  integer := 0;
  v_xp_earned       integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_role, v_clinic_id
  FROM public.profiles WHERE id = v_uid;

  IF v_role != 'PATIENT' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF p_actual_qty <= 0 THEN
    RAISE EXCEPTION 'INVALID: actual_qty must be > 0' USING ERRCODE = 'P0002';
  END IF;

  SELECT mpi.id,
         mpi.food_name,
         mpi.quantity  AS prescribed_qty,
         mpi.unit      AS prescribed_unit
  INTO v_item
  FROM public.meal_plan_items mpi
  JOIN public.meal_plans mp ON mp.id = mpi.plan_id
  WHERE mpi.id = p_plan_item_id
    AND mp.patient_id = v_uid
    AND mpi.is_active = true
    AND mp.is_active  = true
    AND mp.start_date <= v_today
    AND (mp.end_date IS NULL OR mp.end_date >= v_today);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NOT_FOUND: plan item not available today' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.meal_logs
    WHERE plan_item_id = p_plan_item_id
      AND patient_id   = v_uid
      AND logged_at::date = v_today
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'ALREADY_LOGGED: this item was already logged today' USING ERRCODE = 'P0002';
  END IF;

  SELECT COUNT(mpi.id) INTO v_total_items
  FROM public.meal_plan_items mpi
  JOIN public.meal_plans mp ON mp.id = mpi.plan_id
  WHERE mp.patient_id  = v_uid
    AND mpi.is_active  = true
    AND mp.is_active   = true
    AND mp.start_date <= v_today
    AND (mp.end_date IS NULL OR mp.end_date >= v_today);

  v_total_items := GREATEST(v_total_items, 1);
  v_base_xp     := CEILING(1000.0 / v_total_items)::integer;

  IF p_actual_qty >= v_item.prescribed_qty * 0.8 THEN
    v_adherence_bonus := 75;
  END IF;

  v_xp_earned := v_base_xp + v_adherence_bonus;

  INSERT INTO public.meal_logs (
    patient_id, clinic_id, food_name, category,
    quantity, unit, calories, plan_item_id,
    xp_earned, notes, logged_at, created_by, updated_by
  ) VALUES (
    v_uid, v_clinic_id, v_item.food_name, 'MEAL',
    p_actual_qty, p_actual_unit, p_actual_cal, p_plan_item_id,
    v_xp_earned, p_notes, now(), v_uid, v_uid
  )
  RETURNING id INTO v_log_id;

  SELECT COUNT(DISTINCT ml.plan_item_id) INTO v_logged_count
  FROM public.meal_logs ml
  JOIN public.meal_plan_items mpi ON mpi.id = ml.plan_item_id
  JOIN public.meal_plans mp ON mp.id = mpi.plan_id
  WHERE mp.patient_id   = v_uid
    AND ml.logged_at::date = v_today
    AND ml.deleted_at  IS NULL
    AND mpi.is_active  = true
    AND mp.is_active   = true
    AND mp.start_date <= v_today
    AND (mp.end_date IS NULL OR mp.end_date >= v_today);

  IF v_logged_count >= v_total_items THEN
    v_complete_bonus := 200;
    v_xp_earned      := v_xp_earned + v_complete_bonus;
    UPDATE public.meal_logs SET xp_earned = xp_earned + v_complete_bonus WHERE id = v_log_id;
  END IF;

  UPDATE public.gamification_stats
  SET experience = experience + v_xp_earned,
      points     = points     + v_xp_earned,
      level      = LEAST(FLOOR((experience + v_xp_earned) / 500.0)::integer + 1, 100),
      updated_at = now(),
      updated_by = v_uid
  WHERE patient_id = v_uid;

  RETURN jsonb_build_object(
    'log_id',             v_log_id,
    'xp_earned',          v_xp_earned,
    'base_xp',            v_base_xp,
    'adherence_bonus',    v_adherence_bonus,
    'complete_day_bonus', v_complete_bonus
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_meal_from_plan(uuid, numeric, public.measurement_unit, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_meal_from_plan(uuid, numeric, public.measurement_unit, integer, text) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 10. FUNCTION: log_free_meal (patient)                   │
-- │    XP: 150 pts flat; max 4 free meals/day earn XP      │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.log_free_meal(
  p_food_name text,
  p_qty       numeric,
  p_unit      public.measurement_unit,
  p_calories  integer DEFAULT NULL,
  p_notes     text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid        uuid := auth.uid();
  v_clinic_id  uuid;
  v_role       user_role;
  v_log_id     uuid;
  v_today      date := CURRENT_DATE;
  v_free_count integer;
  v_xp_earned  integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_role, v_clinic_id
  FROM public.profiles WHERE id = v_uid;

  IF v_role != 'PATIENT' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF p_food_name IS NULL OR trim(p_food_name) = '' THEN
    RAISE EXCEPTION 'INVALID: food_name required' USING ERRCODE = 'P0002';
  END IF;

  IF p_qty <= 0 THEN
    RAISE EXCEPTION 'INVALID: qty must be > 0' USING ERRCODE = 'P0002';
  END IF;

  SELECT COUNT(*) INTO v_free_count
  FROM public.meal_logs
  WHERE patient_id    = v_uid
    AND category      = 'MEAL'
    AND plan_item_id IS NULL
    AND logged_at::date = v_today
    AND deleted_at   IS NULL;

  v_xp_earned := CASE WHEN v_free_count < 4 THEN 150 ELSE 0 END;

  INSERT INTO public.meal_logs (
    patient_id, clinic_id, food_name, category,
    quantity, unit, calories, xp_earned, notes,
    logged_at, created_by, updated_by
  ) VALUES (
    v_uid, v_clinic_id, trim(p_food_name), 'MEAL',
    p_qty, p_unit, p_calories, v_xp_earned, p_notes,
    now(), v_uid, v_uid
  )
  RETURNING id INTO v_log_id;

  IF v_xp_earned > 0 THEN
    UPDATE public.gamification_stats
    SET experience = experience + v_xp_earned,
        points     = points     + v_xp_earned,
        level      = LEAST(FLOOR((experience + v_xp_earned) / 500.0)::integer + 1, 100),
        updated_at = now(),
        updated_by = v_uid
    WHERE patient_id = v_uid;
  END IF;

  RETURN jsonb_build_object(
    'log_id',     v_log_id,
    'xp_earned',  v_xp_earned,
    'free_count', v_free_count + 1
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_free_meal(text, numeric, public.measurement_unit, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_free_meal(text, numeric, public.measurement_unit, integer, text) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 11. FUNCTION: get_today_plan (patient)                  │
-- │    Returns today's plan items with log status           │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.get_today_plan(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  item_id         uuid,
  meal_time       public.meal_time_type,
  food_name       text,
  prescribed_qty  numeric,
  prescribed_unit public.measurement_unit,
  prescribed_cal  integer,
  purpose         text,
  sequence        integer,
  log_id          uuid,
  actual_qty      numeric,
  actual_unit     public.measurement_unit,
  actual_cal      integer,
  logged_at       timestamptz,
  xp_earned       integer,
  log_notes       text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_role user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;

  IF v_role != 'PATIENT' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    mpi.id                    AS item_id,
    mpi.meal_time,
    mpi.food_name,
    mpi.quantity              AS prescribed_qty,
    mpi.unit                  AS prescribed_unit,
    mpi.calories              AS prescribed_cal,
    mpi.purpose,
    mpi.sequence,
    ml.id                     AS log_id,
    ml.quantity               AS actual_qty,
    ml.unit                   AS actual_unit,
    ml.calories               AS actual_cal,
    ml.logged_at,
    COALESCE(ml.xp_earned, 0) AS xp_earned,
    ml.notes                  AS log_notes
  FROM public.meal_plan_items mpi
  JOIN public.meal_plans mp ON mp.id = mpi.plan_id
  LEFT JOIN public.meal_logs ml
    ON ml.plan_item_id    = mpi.id
   AND ml.logged_at::date = p_date
   AND ml.deleted_at     IS NULL
  WHERE mp.patient_id  = v_uid
    AND mpi.is_active  = true
    AND mp.is_active   = true
    AND mp.start_date <= p_date
    AND (mp.end_date IS NULL OR mp.end_date >= p_date)
  ORDER BY mpi.sequence, mpi.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_today_plan(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_today_plan(date) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 12. FUNCTION: create_meal_plan (nutritionist)           │
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
GRANT EXECUTE ON FUNCTION public.create_meal_plan(uuid, text, date, date, text) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 13. FUNCTION: upsert_meal_plan_item (nutritionist)      │
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
GRANT EXECUTE ON FUNCTION public.upsert_meal_plan_item(uuid, public.meal_time_type, text, numeric, public.measurement_unit, integer, text, text, integer, uuid) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 14. FUNCTION: delete_meal_plan_item (nutritionist)      │
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
GRANT EXECUTE ON FUNCTION public.delete_meal_plan_item(uuid) TO authenticated;

-- ┌─────────────────────────────────────────────────────────┐
-- │ 15. FUNCTION: get_patient_plan_summary (nutritionist)   │
-- │    Returns plan items + patient adherence logs          │
-- └─────────────────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION public.get_patient_plan_summary(
  p_patient_id uuid,
  p_date       date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  plan_id         uuid,
  plan_title      text,
  item_id         uuid,
  meal_time       public.meal_time_type,
  food_name       text,
  prescribed_qty  numeric,
  prescribed_unit public.measurement_unit,
  prescribed_cal  integer,
  purpose         text,
  sequence        integer,
  log_id          uuid,
  actual_qty      numeric,
  actual_unit     public.measurement_unit,
  actual_cal      integer,
  logged_at       timestamptz,
  xp_earned       integer,
  adherence_pct   numeric
)
LANGUAGE plpgsql
STABLE
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

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_patient_id AND clinic_id = v_clinic_id
  ) THEN
    RAISE EXCEPTION 'NOT_FOUND: patient not in your clinic' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT
    mp.id                                             AS plan_id,
    mp.title                                          AS plan_title,
    mpi.id                                            AS item_id,
    mpi.meal_time,
    mpi.food_name,
    mpi.quantity                                      AS prescribed_qty,
    mpi.unit                                          AS prescribed_unit,
    mpi.calories                                      AS prescribed_cal,
    mpi.purpose,
    mpi.sequence,
    ml.id                                             AS log_id,
    ml.quantity                                       AS actual_qty,
    ml.unit                                           AS actual_unit,
    ml.calories                                       AS actual_cal,
    ml.logged_at,
    COALESCE(ml.xp_earned, 0)                        AS xp_earned,
    CASE
      WHEN ml.id IS NULL    THEN 0::numeric
      ELSE LEAST(ROUND((ml.quantity / mpi.quantity) * 100, 1), 200)
    END                                               AS adherence_pct
  FROM public.meal_plan_items mpi
  JOIN public.meal_plans mp ON mp.id = mpi.plan_id
  LEFT JOIN public.meal_logs ml
    ON ml.plan_item_id    = mpi.id
   AND ml.logged_at::date = p_date
   AND ml.deleted_at     IS NULL
  WHERE mp.patient_id   = p_patient_id
    AND mp.clinic_id    = v_clinic_id
    AND mpi.is_active   = true
    AND mp.is_active    = true
    AND mp.start_date  <= p_date
    AND (mp.end_date IS NULL OR mp.end_date >= p_date)
  ORDER BY mpi.sequence, mpi.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_patient_plan_summary(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_patient_plan_summary(uuid, date) TO authenticated;
