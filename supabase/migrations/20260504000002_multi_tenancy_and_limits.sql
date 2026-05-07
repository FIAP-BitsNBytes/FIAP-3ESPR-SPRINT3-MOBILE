-- supabase/migrations/20260504000002_multi_tenancy_and_limits.sql

-- 1. Novos Tipos e Extensões
CREATE TYPE measurement_unit AS ENUM ('GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES');

-- 2. Tabela de Clínicas (Multi-tenancy)
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    
    -- Audit Columns
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- Ativar RLS para clinics
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- 3. Refatoração das Tabelas Existentes para Multi-tenancy
-- Adicionando clinic_id em todas as tabelas
ALTER TABLE profiles ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE nutritionist_details ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE patient_details ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE meal_logs ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE evolution_logs ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE gamification_stats ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE appointments ADD COLUMN clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;

-- Adicionando regra de negócio de refeições prescritas
ALTER TABLE patient_details ADD COLUMN prescribed_meals_per_day INTEGER DEFAULT 3 NOT NULL;

-- Refatoração DDD em meal_logs
-- Primeiro alteramos a estrutura
ALTER TABLE meal_logs DROP COLUMN quantity;
ALTER TABLE meal_logs ADD COLUMN quantity DECIMAL(10,2) NOT NULL;
ALTER TABLE meal_logs ADD COLUMN unit measurement_unit NOT NULL;

-- 4. Funções de Proteção e Cálculo (Gamificação)
CREATE OR REPLACE FUNCTION check_meal_log_limit()
RETURNS TRIGGER AS $$
DECLARE
    meals_limit INTEGER;
    current_meals_count INTEGER;
BEGIN
    -- Busca o limite definido para o paciente
    SELECT prescribed_meals_per_day + 2 INTO meals_limit
    FROM patient_details
    WHERE id = NEW.patient_id;

    -- Conta registros do dia
    SELECT COUNT(*) INTO current_meals_count
    FROM meal_logs
    WHERE patient_id = NEW.patient_id
      AND DATE(logged_at) = CURRENT_DATE;

    -- Validação
    IF current_meals_count >= meals_limit THEN
        RAISE EXCEPTION 'DAILY_LIMIT_EXCEEDED: Você atingiu o limite de registros do dia (% refeições).', meals_limit 
        USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para aplicar o limite antes de inserir
CREATE TRIGGER trg_check_meal_limit
BEFORE INSERT ON meal_logs
FOR EACH ROW EXECUTE PROCEDURE check_meal_log_limit();

-- 5. Reconstrução de RLS Estrito (Isolamento por Clínica e Usuário)

-- Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public profiles are readable by authenticated" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Patients view own logs" ON meal_logs;
DROP POLICY IF EXISTS "Nutritionists view linked patient logs" ON meal_logs;

-- Funções Auxiliares de Segurança
CREATE OR REPLACE FUNCTION get_user_clinic()
RETURNS UUID AS $$
    SELECT clinic_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLÍTICAS: CLINICS
CREATE POLICY "Users view own clinic" ON clinics FOR SELECT 
USING (id = get_user_clinic());

-- POLÍTICAS: PROFILES
CREATE POLICY "Profiles visible within same clinic" ON profiles FOR SELECT 
USING (clinic_id = get_user_clinic());

CREATE POLICY "Users update own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- POLÍTICAS: MEAL_LOGS (Isolamento Total)
CREATE POLICY "Patients manage own meal_logs" ON meal_logs FOR ALL 
USING (
    auth.uid() = patient_id 
    AND clinic_id = get_user_clinic()
);

CREATE POLICY "Nutritionists view patient logs in clinic" ON meal_logs FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'NUTRITIONIST')
    AND clinic_id = get_user_clinic()
    -- Adicionalmente podemos forçar o vínculo direto se necessário
    AND nutritionist_id = auth.uid()
);

-- POLÍTICAS: EVOLUTION_LOGS
CREATE POLICY "Patients view own evolution" ON evolution_logs FOR SELECT 
USING (auth.uid() = patient_id AND clinic_id = get_user_clinic());

CREATE POLICY "Nutritionists manage patient evolution" ON evolution_logs FOR ALL 
USING (
    auth.uid() = nutritionist_id 
    AND clinic_id = get_user_clinic()
);

-- POLÍTICAS: PATIENT_DETAILS
CREATE POLICY "Patient/Nutri access details" ON patient_details FOR ALL 
USING (
    (auth.uid() = id OR auth.uid() = nutritionist_id)
    AND clinic_id = get_user_clinic()
);

-- POLÍTICAS: GAMIFICATION_STATS
CREATE POLICY "Clinic access gamification" ON gamification_stats FOR SELECT 
USING (clinic_id = get_user_clinic());

CREATE POLICY "Patient update own points" ON gamification_stats FOR UPDATE 
USING (auth.uid() = patient_id AND clinic_id = get_user_clinic());

-- 6. Auditoria de Atualização para Clínicas
CREATE TRIGGER update_clinics_modtime BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. Índices de Performance para Multi-tenancy
CREATE INDEX idx_profiles_clinic ON profiles(clinic_id);
CREATE INDEX idx_meal_logs_clinic ON meal_logs(clinic_id);
CREATE INDEX idx_appointments_clinic ON appointments(clinic_id);
