-- supabase/migrations/20260504000003_hardening_and_performance.sql

-- 1. Endurecimento de Funções (Security Best Practices)
-- Adicionando search_path fixo e restringindo execução para evitar ataques de injeção e exposição indevida

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.check_meal_log_limit() SET search_path = public;
ALTER FUNCTION public.get_user_clinic() SET search_path = public;

-- Revogar execução pública de funções críticas e conceder apenas a roles necessárias
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_meal_log_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_clinic() FROM PUBLIC, anon, authenticated;

-- 2. Otimização de Performance: Índices para Chaves Estrangeiras (Missing Indexes)
-- Garante que joins e filtros por Multi-tenancy (clinic_id) sejam instantâneos

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

-- 3. Consolidação de Políticas RLS Redundantes (Performance de Filtro)
-- Removendo políticas duplicadas identificadas pelo advisor para profiles e patient_details

-- Tabela: profiles
DROP POLICY IF EXISTS "Public profiles are readable by authenticated" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
-- A política "Profiles visible within same clinic" e "Users update own profile" (da migration v2) já cobrem isso.

-- Tabela: patient_details
DROP POLICY IF EXISTS "Nutritionists manage linked patient details" ON patient_details;
DROP POLICY IF EXISTS "Patients view own details" ON patient_details;
-- A política "Patient/Nutri access details" (da migration v2) já cobre ambos os casos com menor custo de CPU.

-- 4. Ativação de Acesso Seguro para Appointments (RLS Faltante)
-- Nutricionista gerencia consultas da sua clínica e seus pacientes
CREATE POLICY "Nutritionists manage appointments in clinic" ON public.appointments FOR ALL 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'NUTRITIONIST')
    AND clinic_id = get_user_clinic()
    AND nutritionist_id = auth.uid()
);

-- Paciente vê suas próprias consultas na sua clínica
CREATE POLICY "Patients view own appointments" ON public.appointments FOR SELECT 
USING (
    auth.uid() = patient_id 
    AND clinic_id = get_user_clinic()
);

-- 5. Segurança de Auditoria (Immutable created_by)
-- Impede que o campo created_by seja alterado após a inserção
CREATE OR REPLACE FUNCTION protect_created_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.created_by <> OLD.created_by THEN
        RAISE EXCEPTION 'Cannot modify created_by field for audit integrity.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_protect_audit_clinics BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE PROCEDURE protect_created_by();
CREATE TRIGGER trg_protect_audit_appointments BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE protect_created_by();
