-- 1. Ensure all helper functions are optimized and safe
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Use get_user_clinic() as the primary helper
CREATE OR REPLACE FUNCTION public.get_user_clinic()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Hardening for appointments
DROP POLICY IF EXISTS "Nutritionists manage appointments in clinic" ON public.appointments;
DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;

CREATE POLICY "Nutritionists manage clinic appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (
  get_user_role() IN ('NUTRITIONIST', 'ADMIN') 
  AND clinic_id = get_user_clinic()
);

CREATE POLICY "Patients view own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  auth.uid() = patient_id 
  AND clinic_id = get_user_clinic()
);

-- 3. Hardening for meal_logs
DROP POLICY IF EXISTS "Patients manage own meal_logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Nutritionists view patient logs in clinic" ON public.meal_logs;

CREATE POLICY "Patients manage own logs"
ON public.meal_logs
FOR ALL
TO authenticated
USING (
  auth.uid() = patient_id 
  AND clinic_id = get_user_clinic()
);

CREATE POLICY "Nutritionists view clinic logs"
ON public.meal_logs
FOR SELECT
TO authenticated
USING (
  get_user_role() IN ('NUTRITIONIST', 'ADMIN') 
  AND clinic_id = get_user_clinic()
);

-- 4. Hardening for evolution_logs
DROP POLICY IF EXISTS "Patients view own evolution" ON public.evolution_logs;
DROP POLICY IF EXISTS "Nutritionists manage patient evolution" ON public.evolution_logs;

CREATE POLICY "Patients view own evolution"
ON public.evolution_logs
FOR SELECT
TO authenticated
USING (
  auth.uid() = patient_id 
  AND clinic_id = get_user_clinic()
);

CREATE POLICY "Nutritionists manage clinic evolution"
ON public.evolution_logs
FOR ALL
TO authenticated
USING (
  get_user_role() IN ('NUTRITIONIST', 'ADMIN') 
  AND clinic_id = get_user_clinic()
);

-- 5. Hardening for gamification_stats
DROP POLICY IF EXISTS "Clinic access gamification" ON public.gamification_stats;
DROP POLICY IF EXISTS "Patients read own gamification" ON public.gamification_stats;

CREATE POLICY "Authenticated users view clinic stats"
ON public.gamification_stats
FOR SELECT
TO authenticated
USING (clinic_id = get_user_clinic());

-- 6. Hardening for nutritionist_details
DROP POLICY IF EXISTS "Admins manage nutritionist accounts" ON public.nutritionist_details;

CREATE POLICY "Admins manage clinic nutritionists"
ON public.nutritionist_details
FOR ALL
TO authenticated
USING (
  get_user_role() = 'ADMIN' 
  AND (clinic_id = get_user_clinic() OR clinic_id IS NULL)
);

-- 7. Audit transaction logs hardening
DROP POLICY IF EXISTS "Admins read audit logs" ON audit.transaction_logs;
CREATE POLICY "Admins read audit logs"
ON audit.transaction_logs
FOR SELECT
TO authenticated
USING (get_user_role() = 'ADMIN');
;
