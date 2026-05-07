-- ================================================================
-- Secure patient progression access
-- ================================================================
-- Rules enforced here:
--   - Patients can read their own progression inputs.
--   - Assigned nutritionists can read patient progression inputs.
--   - Only the patient can insert/update/delete progression inputs.
--   - Gamification/progression summary is readable only by the patient
--     or the assigned nutritionist, never broadly by the whole clinic.

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_stats ENABLE ROW LEVEL SECURITY;

-- Replace broad/ambiguous meal log policies with explicit operation policies.
DROP POLICY IF EXISTS "Patients manage own meal_logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Nutritionists view patient logs in clinic" ON public.meal_logs;
DROP POLICY IF EXISTS "Patients view own logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Nutritionists view linked patient logs" ON public.meal_logs;

CREATE POLICY "Patients read own progression logs"
  ON public.meal_logs
  FOR SELECT
  USING (
    auth.uid() = patient_id
    AND clinic_id = public.get_user_clinic()
  );

CREATE POLICY "Nutritionists read assigned patient progression logs"
  ON public.meal_logs
  FOR SELECT
  USING (
    nutritionist_id = auth.uid()
    AND clinic_id = public.get_user_clinic()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'NUTRITIONIST'
    )
  );

CREATE POLICY "Patients insert own progression logs"
  ON public.meal_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = patient_id
    AND clinic_id = public.get_user_clinic()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'PATIENT'
    )
  );

CREATE POLICY "Patients update own progression logs"
  ON public.meal_logs
  FOR UPDATE
  USING (
    auth.uid() = patient_id
    AND clinic_id = public.get_user_clinic()
  )
  WITH CHECK (
    auth.uid() = patient_id
    AND clinic_id = public.get_user_clinic()
  );

CREATE POLICY "Patients delete own progression logs"
  ON public.meal_logs
  FOR DELETE
  USING (
    auth.uid() = patient_id
    AND clinic_id = public.get_user_clinic()
  );

-- Tighten gamification visibility for the progression screen.
DROP POLICY IF EXISTS "Clinic access gamification" ON public.gamification_stats;
DROP POLICY IF EXISTS "Patients read own gamification" ON public.gamification_stats;
DROP POLICY IF EXISTS "Nutritionists read assigned patient gamification" ON public.gamification_stats;

CREATE POLICY "Patients read own gamification"
  ON public.gamification_stats
  FOR SELECT
  USING (
    auth.uid() = patient_id
    AND clinic_id = public.get_user_clinic()
  );

CREATE POLICY "Nutritionists read assigned patient gamification"
  ON public.gamification_stats
  FOR SELECT
  USING (
    (
      nutritionist_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.patient_details pd
        WHERE pd.id = gamification_stats.patient_id
          AND pd.nutritionist_id = auth.uid()
          AND pd.clinic_id = public.get_user_clinic()
      )
    )
    AND clinic_id = public.get_user_clinic()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'NUTRITIONIST'
    )
  );

COMMENT ON POLICY "Patients insert own progression logs" ON public.meal_logs
  IS 'Only the authenticated patient can insert progression inputs for their own progress screen.';

COMMENT ON POLICY "Nutritionists read assigned patient progression logs" ON public.meal_logs
  IS 'Nutritionists can view progression logs only for patients assigned to them in the same clinic.';
