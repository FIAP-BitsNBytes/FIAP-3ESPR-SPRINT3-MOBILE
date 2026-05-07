-- supabase/migrations/20260504000003_hardening_and_performance.sql

-- 1. Endurecimento de Funções (Security Best Practices)
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.check_meal_log_limit() SET search_path = public;
ALTER FUNCTION public.get_user_clinic() SET search_path = public;

-- Revogar execução pública de funções críticas
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_meal_log_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_clinic() FROM PUBLIC, anon, authenticated;

-- 2. Otimização de Performance: Índices para Chaves Estrangeiras
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_nutritionist_id ON public.appointments(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_evolution_logs_clinic_id ON public.evolution_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_evolution_logs_nutritionist_id ON public.evolution_logs(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_gamification_stats_clinic_id ON public.gamification_stats(clinic_id);
CREATE INDEX IF NOT EXISTS idx_gamification_stats_nutritionist_id ON public.gamification_stats(nutritionist_id);
CREATE INDEX IF NOT EXISTS idx_patient_details_clinic_id ON public.patient_details(clinic_id);
CREATE INDEX IF NOT EXISTS idx_nutritionist_details_clinic_id ON public.nutritionist_details(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinics_created_by ON public.clinics(created_by);

-- 3. Consolidação de Políticas RLS Redundantes
DROP POLICY IF EXISTS "Public profiles are readable by authenticated" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Nutritionists manage linked patient details" ON patient_details;
DROP POLICY IF EXISTS "Patients view own details" ON patient_details;

-- 4. Ativação de Acesso Seguro para Appointments
DROP POLICY IF EXISTS "Nutritionists manage appointments in clinic" ON appointments;
CREATE POLICY "Nutritionists manage appointments in clinic" ON public.appointments FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'NUTRITIONIST')
    AND clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
    AND nutritionist_id = auth.uid()
);

DROP POLICY IF EXISTS "Patients view own appointments" ON appointments;
CREATE POLICY "Patients view own appointments" ON public.appointments FOR SELECT 
USING (
    auth.uid() = patient_id 
    AND clinic_id = (SELECT clinic_id FROM public.profiles WHERE id = auth.uid())
);

-- 5. Segurança de Auditoria
CREATE OR REPLACE FUNCTION protect_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.created_by IS NOT NULL AND NEW.created_by <> OLD.created_by) THEN
        RAISE EXCEPTION 'Cannot modify created_by field for audit integrity.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_audit_clinics ON clinics;
CREATE TRIGGER trg_protect_audit_clinics BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE PROCEDURE protect_created_by();
DROP TRIGGER IF EXISTS trg_protect_audit_appointments ON appointments;
CREATE TRIGGER trg_protect_audit_appointments BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE protect_created_by();
;
