-- supabase/migrations/20260504000002_multi_tenancy_and_limits.sql

-- 1. Novos Tipos e Extensões (Eliminando Strings Mágicas)
DO $$ BEGIN
    CREATE TYPE measurement_unit AS ENUM ('GRAMS', 'MILLILITERS', 'UNITS', 'PORTIONS', 'CALORIES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_type AS ENUM ('MEAL', 'WATER', 'SUPPLEMENT', 'EXERCISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Clínicas (Multi-tenancy)
CREATE TABLE IF NOT EXISTS clinics (
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
-- Adicionando clinic_id em todas as tabelas (Obrigatório para isolamento)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE nutritionist_details ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE patient_details ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE evolution_logs ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE gamification_stats ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE RESTRICT;

-- Adicionando regra de negócio de refeições prescritas (Evitando números mágicos no código)
ALTER TABLE patient_details ADD COLUMN IF NOT EXISTS prescribed_meals_per_day INTEGER DEFAULT 3 NOT NULL;

-- Refatoração DDD em meal_logs
-- Garantindo que quantity seja numérico e unidade seja ENUM
ALTER TABLE meal_logs DROP COLUMN IF EXISTS quantity;
ALTER TABLE meal_logs ADD COLUMN quantity DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE meal_logs ADD COLUMN unit measurement_unit NOT NULL DEFAULT 'GRAMS';
ALTER TABLE meal_logs ADD COLUMN category log_type NOT NULL DEFAULT 'MEAL';

-- 4. Funções de Proteção e Cálculo (Gamificação)
CREATE OR REPLACE FUNCTION check_meal_log_limit()
RETURNS TRIGGER AS $$
DECLARE
    meals_limit INTEGER;
    current_meals_count INTEGER;
    extra_buffer CONSTANT INTEGER := 2; -- Buffer de tolerância (eliminando número mágico)
BEGIN
    -- Busca o limite definido para o paciente
    SELECT prescribed_meals_per_day + extra_buffer INTO meals_limit
    FROM patient_details
    WHERE id = NEW.patient_id;

    -- Conta registros do dia para a categoria MEAL
    SELECT COUNT(*) INTO current_meals_count
    FROM meal_logs
    WHERE patient_id = NEW.patient_id
      AND category = 'MEAL'
      AND DATE(logged_at) = CURRENT_DATE;

    -- Validação de Limite
    IF current_meals_count >= meals_limit THEN
        RAISE EXCEPTION 'DAILY_LIMIT_EXCEEDED: Limit of % meals reached for today.', meals_limit 
        USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para aplicar o limite antes de inserir
DROP TRIGGER IF EXISTS trg_check_meal_limit ON meal_logs;
CREATE TRIGGER trg_check_meal_limit
BEFORE INSERT ON meal_logs
FOR EACH ROW 
WHEN (NEW.category = 'MEAL')
EXECUTE PROCEDURE check_meal_log_limit();

-- 5. Reconstrução de RLS Estrito (Isolamento por Clínica e Usuário)

-- Funções Auxiliares de Segurança (Evitando repetição de lógica RLS)
CREATE OR REPLACE FUNCTION get_user_clinic()
RETURNS UUID AS $$
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- POLÍTICAS: CLINICS
DROP POLICY IF EXISTS "Users view own clinic" ON clinics;
CREATE POLICY "Users view own clinic" ON clinics FOR SELECT 
USING (id = get_user_clinic());

-- POLÍTICAS: PROFILES
DROP POLICY IF EXISTS "Profiles visible within same clinic" ON profiles;
CREATE POLICY "Profiles visible within same clinic" ON profiles FOR SELECT 
USING (clinic_id = get_user_clinic());

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- POLÍTICAS: MEAL_LOGS (Isolamento Total)
DROP POLICY IF EXISTS "Patients manage own meal_logs" ON meal_logs;
CREATE POLICY "Patients manage own meal_logs" ON meal_logs FOR ALL 
USING (
    auth.uid() = patient_id 
    AND clinic_id = get_user_clinic()
);

DROP POLICY IF EXISTS "Nutritionists view patient logs in clinic" ON meal_logs;
CREATE POLICY "Nutritionists view patient logs in clinic" ON meal_logs FOR SELECT 
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'NUTRITIONIST')
    AND clinic_id = get_user_clinic()
    AND nutritionist_id = auth.uid()
);

-- POLÍTICAS: EVOLUTION_LOGS
DROP POLICY IF EXISTS "Patients view own evolution" ON evolution_logs;
CREATE POLICY "Patients view own evolution" ON evolution_logs FOR SELECT 
USING (auth.uid() = patient_id AND clinic_id = get_user_clinic());

DROP POLICY IF EXISTS "Nutritionists manage patient evolution" ON evolution_logs;
CREATE POLICY "Nutritionists manage patient evolution" ON evolution_logs FOR ALL 
USING (
    auth.uid() = nutritionist_id 
    AND clinic_id = get_user_clinic()
);

-- POLÍTICAS: PATIENT_DETAILS
DROP POLICY IF EXISTS "Patient/Nutri access details" ON patient_details;
CREATE POLICY "Patient/Nutri access details" ON patient_details FOR ALL 
USING (
    (auth.uid() = id OR auth.uid() = nutritionist_id)
    AND clinic_id = get_user_clinic()
);

-- POLÍTICAS: GAMIFICATION_STATS
DROP POLICY IF EXISTS "Clinic access gamification" ON gamification_stats;
CREATE POLICY "Clinic access gamification" ON gamification_stats FOR SELECT 
USING (clinic_id = get_user_clinic());

DROP POLICY IF EXISTS "Patient update own points" ON gamification_stats;
CREATE POLICY "Patient update own points" ON gamification_stats FOR UPDATE 
USING (auth.uid() = patient_id AND clinic_id = get_user_clinic());

-- 6. Auditoria e Performance
DROP TRIGGER IF EXISTS update_clinics_modtime ON clinics;
CREATE TRIGGER update_clinics_modtime BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_profiles_clinic ON profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_clinic ON meal_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic ON appointments(clinic_id);
;
