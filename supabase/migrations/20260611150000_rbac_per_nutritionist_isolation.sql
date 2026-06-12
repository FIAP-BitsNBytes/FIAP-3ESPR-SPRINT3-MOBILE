-- =====================================================================
-- RBAC: isolamento por nutricionista (carteira de pacientes)
--
-- Modelo de acesso implementado:
--   - Nutricionista: vê SOMENTE os próprios pacientes
--     (vínculo: patient_details.nutritionist_id, populado no convite)
--   - Paciente: vê SOMENTE o próprio nutricionista
--   - Admin (clínica): vê perfis, agenda e gamificação de toda a clínica,
--     mas NUNCA dados clínicos (meal_logs, evolution_logs, meal_plans,
--     fotos) — exceto se o nutricionista conceder permissão explícita
--     via patient_details.clinic_access_granted
--   - Ranking: continua clinic-wide via RPC get_gamification_ranking
--     (SECURITY DEFINER, já scoped por clínica)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Coluna de consentimento: nutricionista autoriza a clínica a ver
--    dados médicos do paciente
-- ---------------------------------------------------------------------
ALTER TABLE public.patient_details
  ADD COLUMN IF NOT EXISTS clinic_access_granted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.patient_details.clinic_access_granted IS
  'Quando true, o admin da clínica pode ler dados clínicos deste paciente. Controlado pelo nutricionista responsável.';

-- ---------------------------------------------------------------------
-- 2. Helpers SECURITY DEFINER (evitam recursão de RLS)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_my_patient(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_details
    WHERE id = p_patient_id AND nutritionist_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_nutritionist()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT nutritionist_id FROM public.patient_details WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.clinic_has_medical_consent(p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_details
    WHERE id = p_patient_id AND clinic_access_granted = true
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_my_patient(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_nutritionist() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.clinic_has_medical_consent(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_my_patient(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_nutritionist() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clinic_has_medical_consent(uuid) TO authenticated;

-- ---------------------------------------------------------------------
-- 3. meal_logs: nutricionista só vê logs dos próprios pacientes;
--    admin só com consentimento
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Nutritionists view clinic logs" ON public.meal_logs;

CREATE POLICY "nutritionists_view_own_patient_logs"
ON public.meal_logs
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND is_my_patient(patient_id)
);

CREATE POLICY "admins_view_logs_with_consent"
ON public.meal_logs
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'ADMIN'
  AND clinic_id = get_user_clinic()
  AND clinic_has_medical_consent(patient_id)
);

-- ---------------------------------------------------------------------
-- 4. evolution_logs: idem
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Nutritionists manage clinic evolution" ON public.evolution_logs;

CREATE POLICY "nutritionists_manage_own_patient_evolution"
ON public.evolution_logs
FOR ALL
TO authenticated
USING (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND is_my_patient(patient_id)
)
WITH CHECK (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND is_my_patient(patient_id)
);

CREATE POLICY "admins_view_evolution_with_consent"
ON public.evolution_logs
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'ADMIN'
  AND clinic_id = get_user_clinic()
  AND clinic_has_medical_consent(patient_id)
);

-- ---------------------------------------------------------------------
-- 5. meal_plans / meal_plan_items: nutricionista gerencia apenas planos
--    dos próprios pacientes; admin sem acesso (dado clínico)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "meal_plans: nutritionist full" ON public.meal_plans;

CREATE POLICY "meal_plans: nutritionist own patients"
ON public.meal_plans
FOR ALL
TO authenticated
USING (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND is_my_patient(patient_id)
)
WITH CHECK (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND is_my_patient(patient_id)
);

DROP POLICY IF EXISTS "meal_plan_items: nutritionist full" ON public.meal_plan_items;

CREATE POLICY "meal_plan_items: nutritionist own patients"
ON public.meal_plan_items
FOR ALL
TO authenticated
USING (
  get_user_role() = 'NUTRITIONIST'
  AND EXISTS (
    SELECT 1 FROM public.meal_plans mp
    WHERE mp.id = plan_id AND is_my_patient(mp.patient_id)
  )
)
WITH CHECK (
  get_user_role() = 'NUTRITIONIST'
  AND EXISTS (
    SELECT 1 FROM public.meal_plans mp
    WHERE mp.id = plan_id AND is_my_patient(mp.patient_id)
  )
);

-- ---------------------------------------------------------------------
-- 6. profiles: nutricionista vê só os próprios pacientes;
--    paciente vê só o próprio nutricionista; admin vê a clínica toda
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "p2_nutritionists_view_clinic" ON public.profiles;

CREATE POLICY "p2_nutritionists_view_own_patients"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe() = 'NUTRITIONIST'
  AND is_my_patient(id)
);

DROP POLICY IF EXISTS "p4_patients_view_nutritionists" ON public.profiles;

CREATE POLICY "p4_patients_view_own_nutritionist"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe() = 'PATIENT'
  AND id = get_my_nutritionist()
);

-- p1 (próprio perfil) e p3 (admin vê clínica) permanecem inalteradas.

-- ---------------------------------------------------------------------
-- 7. gamification_stats: pontos não são dado médico.
--    Paciente vê o próprio; nutricionista vê os dos próprios pacientes;
--    admin vê a clínica (alimenta dashboards e a tela de pacientes por
--    nutricionista). Ranking nominal via RPC SECURITY DEFINER.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users view clinic stats" ON public.gamification_stats;

CREATE POLICY "patients_view_own_stats"
ON public.gamification_stats
FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

CREATE POLICY "nutritionists_view_own_patient_stats"
ON public.gamification_stats
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND is_my_patient(patient_id)
);

CREATE POLICY "admins_view_clinic_stats"
ON public.gamification_stats
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'ADMIN'
  AND clinic_id = get_user_clinic()
);

-- ---------------------------------------------------------------------
-- 8. appointments: nutricionista gerencia só a própria agenda;
--    admin enxerga a agenda da clínica (operacional, não médico)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Nutritionists manage clinic appointments" ON public.appointments;

CREATE POLICY "nutritionists_manage_own_appointments"
ON public.appointments
FOR ALL
TO authenticated
USING (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND nutritionist_id = auth.uid()
)
WITH CHECK (
  get_user_role() = 'NUTRITIONIST'
  AND clinic_id = get_user_clinic()
  AND nutritionist_id = auth.uid()
);

CREATE POLICY "admins_view_clinic_appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  get_user_role() = 'ADMIN'
  AND clinic_id = get_user_clinic()
);

-- ---------------------------------------------------------------------
-- 9. Storage meal-photos: corrige policy quebrada (referenciava tabela
--    inexistente clinic_members) e restringe ao nutricionista do paciente
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "nutritionist_select_patient_meal_photos" ON storage.objects;

CREATE POLICY "nutritionist_select_own_patient_meal_photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'meal-photos'
  AND EXISTS (
    SELECT 1 FROM public.patient_details pd
    WHERE pd.nutritionist_id = auth.uid()
      AND pd.id::text = (storage.foldername(name))[1]
  )
);
