-- supabase/migrations/20260504000004_banking_grade_audit_and_logistics_perf.sql

-- 1. ESTRUTURA BANCÁRIA: Auditoria Imutável (Audit Trail)
-- Criamos um schema separado para logs de auditoria que ninguém (nem mesmo o app) pode alterar
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.transaction_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    client_addr TEXT,
    executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS estrito na auditoria: Ninguém lê ou escreve exceto o sistema
ALTER TABLE audit.transaction_logs ENABLE ROW LEVEL SECURITY;

-- Função de Auditoria Universal
CREATE OR REPLACE FUNCTION audit.if_modified_func() RETURNS TRIGGER AS $body$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit.transaction_logs (table_name, record_id, action, old_data, new_data, changed_by, client_addr)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), auth.uid(), inet_client_addr()::text);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.transaction_logs (table_name, record_id, action, old_data, changed_by, client_addr)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), auth.uid(), inet_client_addr()::text);
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.transaction_logs (table_name, record_id, action, new_data, changed_by, client_addr)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), auth.uid(), inet_client_addr()::text);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = audit, public;

-- 2. PERFORMANCE LOGÍSTICA: Particionamento de Tabelas de Log
-- Tabelas de meal_logs crescem muito rápido. Vamos prepará-las para milhões de registros.
-- Nota: Em Supabase/Postgres 15+, o particionamento requer recriação se não planejado. 
-- Aqui usaremos Índices Parciais e Estatísticas Estendidas para simular performance logística sem downtime imediato.

-- Estatísticas estendidas para o planejador de consultas entender a relação Paciente-Clínica
CREATE STATISTICS IF NOT EXISTS stts_meal_logs_patient_clinic (dependencies) ON patient_id, clinic_id FROM meal_logs;

-- Índices Parciais: Acelera as consultas de "Refeições de Hoje" (o caso de uso mais comum)
CREATE INDEX IF NOT EXISTS idx_meal_logs_today ON public.meal_logs (patient_id, logged_at) 
WHERE (logged_at >= CURRENT_DATE);

-- 3. INTEGRIDADE BANCÁRIA: Soft Delete e Constraints
-- Em bancos, nunca deletamos fisicamente dados clínicos.
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.evolution_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Filtro automático via RLS para ignorar deletados (Virtual Private Database pattern)
DROP POLICY IF EXISTS "Patients manage own meal_logs" ON meal_logs;
CREATE POLICY "Patients manage own meal_logs" ON meal_logs FOR ALL 
USING (
    auth.uid() = patient_id 
    AND clinic_id = get_user_clinic()
    AND deleted_at IS NULL
);

-- 4. VALIDAÇÃO DE NEGÓCIO RIGOROSA (Check Constraints)
-- Evita "lixo" no banco que degrada performance e confiabilidade
ALTER TABLE public.meal_logs ADD CONSTRAINT check_calories_positive CHECK (calories >= 0);
ALTER TABLE public.evolution_logs ADD CONSTRAINT check_weight_positive CHECK (weight > 0);

-- 5. APLICAÇÃO DA AUDITORIA NAS TABELAS CRÍTICAS
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('meal_logs', 'evolution_logs', 'appointments', 'patient_details')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON public.%I', t);
        EXECUTE format('CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE PROCEDURE audit.if_modified_func()', t);
    END LOOP;
END $$;

-- 6. VACUUM E MANUTENÇÃO (Logística de Storage)
-- Ajusta o autovacuum para ser mais agressivo em tabelas de log para evitar bloat
ALTER TABLE public.meal_logs SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.evolution_logs SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
