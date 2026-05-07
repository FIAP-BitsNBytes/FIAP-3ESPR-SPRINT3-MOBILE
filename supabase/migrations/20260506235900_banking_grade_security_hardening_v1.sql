-- ================================================================
-- MIGRATION: banking_grade_security_hardening_v1
-- Date: 2026-05-06
-- Fixes:
--   [CRITICAL] Privilege escalation via signup role injection
--   [CRITICAL] archive_old_data() callable by anon (data destruction)
--   [CRITICAL] search_patients() callable by anon + no clinic scope
--   [CRITICAL] refresh_gamification_ranking() DoS via anon
--   [CRITICAL] Patient direct UPDATE on gamification_stats (XP cheat)
--   [CRITICAL] mv_gamification_ranking PII leak to anon
--   [HIGH]     Duplicate RLS policies breaking multi-tenancy
--   [HIGH]     evolution_logs policy missing clinic_id check
--   [HIGH]     gamification_stats no patient SELECT policy
--   [HIGH]     nutritionist_details no self-read policy
--   [HIGH]     audit.transaction_logs no RLS policies
--   [PERF]     11 missing FK and hot-path indexes
-- ================================================================


-- ----------------------------------------------------------------
-- SECTION 1: REVOKE dangerous grants from anon / authenticated
-- ----------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.archive_old_data() FROM anon;
REVOKE EXECUTE ON FUNCTION public.archive_old_data() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_gamification_ranking() FROM anon;
REVOKE EXECUTE ON FUNCTION public.refresh_gamification_ranking() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.protect_created_by() FROM anon;
REVOKE EXECUTE ON FUNCTION public.protect_created_by() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.search_patients(text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_patients(text, uuid) FROM authenticated;


-- ----------------------------------------------------------------
-- SECTION 2: FIX handle_new_user — eliminate privilege escalation
--   VULN: raw_user_meta_data->>'role' trusted at signup.
--   Anyone can POST {"role":"ADMIN"} and become ADMIN on signup.
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)),
    'PATIENT'::user_role  -- role elevation via set_user_role() only
  );
  RETURN NEW;
END;
$$;


-- ----------------------------------------------------------------
-- SECTION 3: Admin-only role assignment function
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_user_role(
  p_target_user_id uuid,
  p_new_role        user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_role   user_role;
  v_caller_clinic uuid;
  v_target_clinic uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_caller_role, v_caller_clinic
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role <> 'ADMIN' THEN
    RAISE EXCEPTION 'FORBIDDEN: Only admins can assign roles' USING ERRCODE = 'P0001';
  END IF;

  IF p_target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'FORBIDDEN: Cannot change own role' USING ERRCODE = 'P0001';
  END IF;

  SELECT clinic_id INTO v_target_clinic
  FROM public.profiles WHERE id = p_target_user_id;

  IF v_target_clinic IS DISTINCT FROM v_caller_clinic THEN
    RAISE EXCEPTION 'FORBIDDEN: Cross-clinic role assignment denied' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles SET role = p_new_role WHERE id = p_target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_user_role(uuid, user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_user_role(uuid, user_role) TO authenticated;


-- ----------------------------------------------------------------
-- SECTION 4: FIX archive_old_data — admin-only guard
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.archive_old_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: Only admins can archive data' USING ERRCODE = 'P0001';
  END IF;

  WITH moved_rows AS (
    DELETE FROM public.meal_logs
    WHERE logged_at < NOW() - INTERVAL '2 years'
      AND deleted_at IS NOT NULL
    RETURNING *
  )
  INSERT INTO archive.meal_logs_history SELECT * FROM moved_rows;
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_old_data() TO authenticated;


-- ----------------------------------------------------------------
-- SECTION 5: FIX refresh_gamification_ranking — NUTRI/ADMIN only
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.refresh_gamification_ranking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('NUTRITIONIST', 'ADMIN')
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: Only nutritionists and admins can refresh ranking'
    USING ERRCODE = 'P0001';
  END IF;

  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_gamification_ranking;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_gamification_ranking() TO authenticated;


-- ----------------------------------------------------------------
-- SECTION 6: FIX search_patients — clinic scope + role enforcement
--   VULN: no clinic check — any authenticated user could enumerate
--   patients in any clinic by passing arbitrary p_clinic_id.
--   DROP required before CREATE to allow parameter rename.
-- ----------------------------------------------------------------

DROP FUNCTION IF EXISTS public.search_patients(text, uuid);

CREATE FUNCTION public.search_patients(
  search_term text,
  p_clinic_id uuid
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_role   user_role;
  v_caller_clinic uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_caller_role, v_caller_clinic
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN: Only nutritionists and admins can search patients'
    USING ERRCODE = 'P0001';
  END IF;

  -- Prevent cross-clinic patient enumeration
  IF v_caller_clinic IS DISTINCT FROM p_clinic_id THEN
    RAISE EXCEPTION 'FORBIDDEN: Cross-clinic data access denied'
    USING ERRCODE = 'P0001';
  END IF;

  -- Minimum length prevents full-table similarity scans
  IF length(trim(search_term)) < 2 THEN
    RAISE EXCEPTION 'INVALID: Search term must be at least 2 characters'
    USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT *
  FROM public.profiles
  WHERE clinic_id = p_clinic_id
    AND role = 'PATIENT'
    AND (
      public.immutable_unaccent(name) % public.immutable_unaccent(search_term)
      OR public.immutable_unaccent(name) ILIKE '%' || public.immutable_unaccent(search_term) || '%'
    )
  ORDER BY similarity(
    public.immutable_unaccent(name),
    public.immutable_unaccent(search_term)
  ) DESC
  LIMIT 20;
END;
$$;

REVOKE ALL ON FUNCTION public.search_patients(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_patients(text, uuid) TO authenticated;


-- ----------------------------------------------------------------
-- SECTION 7: FIX mv_gamification_ranking — lock down PII
--   VULN: anon can SELECT * exposing all patient names + scores.
--   Access now only via get_gamification_ranking() with clinic scope.
-- ----------------------------------------------------------------

REVOKE ALL ON public.mv_gamification_ranking FROM anon;
REVOKE ALL ON public.mv_gamification_ranking FROM authenticated;
REVOKE ALL ON public.mv_gamification_ranking FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_gamification_ranking(
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  patient_id   uuid,
  patient_name text,
  clinic_id    uuid,
  level        integer,
  experience   integer,
  points       integer,
  streak_days  integer,
  clinic_rank  bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_clinic uuid;
  v_caller_role   user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_caller_role, v_caller_clinic
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN: Only nutritionists and admins can view ranking'
    USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT r.patient_id, r.patient_name, r.clinic_id,
         r.level, r.experience, r.points, r.streak_days, r.clinic_rank
  FROM public.mv_gamification_ranking r
  WHERE r.clinic_id = v_caller_clinic
  ORDER BY r.clinic_rank ASC
  LIMIT LEAST(p_limit, 100);
END;
$$;

REVOKE ALL ON FUNCTION public.get_gamification_ranking(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_gamification_ranking(integer) TO authenticated;


-- ----------------------------------------------------------------
-- SECTION 8: FIX duplicate / broken RLS policies
-- ----------------------------------------------------------------

-- meal_logs: no clinic_id check — breaks tenant isolation
DROP POLICY IF EXISTS "Patients view own logs" ON public.meal_logs;

-- meal_logs: no role check — weaker than the scoped version
DROP POLICY IF EXISTS "Nutritionists view linked patient logs" ON public.meal_logs;

-- evolution_logs: NO clinic_id check — nutritionist from Clinic A
-- could access Clinic B patient data if linked
DROP POLICY IF EXISTS "Nutritionists manage linked patient evolution" ON public.evolution_logs;


-- ----------------------------------------------------------------
-- SECTION 9: FIX gamification_stats — prevent XP self-manipulation
--   VULN: any authenticated patient can PATCH their own row via REST
--   and set level=99, points=999999, streak_days=365.
-- ----------------------------------------------------------------

DROP POLICY IF EXISTS "Patient update own points" ON public.gamification_stats;

-- Patients read-only — writes only via award_xp() SECURITY DEFINER
CREATE POLICY "Patients read own gamification"
  ON public.gamification_stats
  FOR SELECT
  USING (auth.uid() = patient_id AND clinic_id = get_user_clinic());


-- ----------------------------------------------------------------
-- SECTION 10: ADD missing access policies
-- ----------------------------------------------------------------

-- Nutritionists can read their own approval status and crm_crn
CREATE POLICY "Nutritionists read own details"
  ON public.nutritionist_details
  FOR SELECT
  USING (auth.uid() = id);


-- ----------------------------------------------------------------
-- SECTION 11: FIX gamification_stats schema
--   nutritionist_id NOT NULL blocks row creation for patients
--   without a nutritionist assigned yet.
-- ----------------------------------------------------------------

ALTER TABLE public.gamification_stats
  ALTER COLUMN nutritionist_id DROP NOT NULL;


-- ----------------------------------------------------------------
-- SECTION 12: Auto-initialize gamification_stats on profile creation
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.init_gamification_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'PATIENT' THEN
    INSERT INTO public.gamification_stats (patient_id, clinic_id)
    VALUES (NEW.id, NEW.clinic_id)
    ON CONFLICT (patient_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.init_gamification_on_profile() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_init_gamification ON public.profiles;
CREATE TRIGGER trg_init_gamification
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.init_gamification_on_profile();


-- ----------------------------------------------------------------
-- SECTION 13: Secure XP award function
--   Replaces direct UPDATE on gamification_stats.
--   Enforces: caller is NUTRI/ADMIN, same clinic, amount 1-500.
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.award_xp(
  p_patient_id uuid,
  p_xp_amount  integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_role    user_role;
  v_caller_clinic  uuid;
  v_patient_clinic uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_caller_role, v_caller_clinic
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN: Only nutritionists can award XP' USING ERRCODE = 'P0001';
  END IF;

  SELECT clinic_id INTO v_patient_clinic
  FROM public.profiles WHERE id = p_patient_id AND role = 'PATIENT';

  IF v_patient_clinic IS DISTINCT FROM v_caller_clinic THEN
    RAISE EXCEPTION 'FORBIDDEN: Cross-clinic XP award denied' USING ERRCODE = 'P0001';
  END IF;

  IF p_xp_amount <= 0 OR p_xp_amount > 500 THEN
    RAISE EXCEPTION 'INVALID: XP amount must be between 1 and 500' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.gamification_stats
  SET experience  = experience + p_xp_amount,
      points      = points + p_xp_amount,
      level       = LEAST(FLOOR((experience + p_xp_amount) / 500.0)::integer + 1, 100),
      updated_at  = NOW(),
      updated_by  = auth.uid()
  WHERE patient_id = p_patient_id;
END;
$$;

REVOKE ALL ON FUNCTION public.award_xp(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer) TO authenticated;


-- ----------------------------------------------------------------
-- SECTION 14: audit.transaction_logs — admin-only read, no direct writes
-- ----------------------------------------------------------------

CREATE POLICY "Admins read audit logs"
  ON audit.transaction_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Block direct audit inserts"
  ON audit.transaction_logs
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block audit updates"
  ON audit.transaction_logs
  FOR UPDATE
  USING (false);

CREATE POLICY "Block audit deletes"
  ON audit.transaction_logs
  FOR DELETE
  USING (false);


-- ----------------------------------------------------------------
-- SECTION 15: PERFORMANCE — missing FK indexes + hot query paths
-- ----------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_appointments_updated_by
  ON public.appointments (updated_by);

CREATE INDEX IF NOT EXISTS idx_evolution_logs_created_by
  ON public.evolution_logs (created_by);

CREATE INDEX IF NOT EXISTS idx_evolution_logs_updated_by
  ON public.evolution_logs (updated_by);

CREATE INDEX IF NOT EXISTS idx_meal_logs_created_by
  ON public.meal_logs (created_by);

CREATE INDEX IF NOT EXISTS idx_meal_logs_updated_by
  ON public.meal_logs (updated_by);

CREATE INDEX IF NOT EXISTS idx_patient_details_created_by
  ON public.patient_details (created_by);

CREATE INDEX IF NOT EXISTS idx_patient_details_updated_by
  ON public.patient_details (updated_by);

CREATE INDEX IF NOT EXISTS idx_nutritionist_details_updated_by
  ON public.nutritionist_details (updated_by);

-- Partial index for check_meal_log_limit trigger hot path
CREATE INDEX IF NOT EXISTS idx_meal_logs_daily_meal_check
  ON public.meal_logs (patient_id, logged_at DESC)
  WHERE category = 'MEAL' AND deleted_at IS NULL;

-- Partial index for pending appointments dashboard
CREATE INDEX IF NOT EXISTS idx_appointments_pending_scheduled
  ON public.appointments (nutritionist_id, scheduled_at)
  WHERE status = 'PENDING';

-- Composite for search_patients + role-scoped dashboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_role
  ON public.profiles (clinic_id, role);
