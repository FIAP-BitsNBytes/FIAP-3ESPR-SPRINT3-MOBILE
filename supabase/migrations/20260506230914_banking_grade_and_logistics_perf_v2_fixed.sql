-- supabase/migrations/20260504000004_banking_grade_audit_and_logistics_perf.sql

-- 1. SCHEMA DE AUDITORIA (Cofre de Transações)
CREATE SCHEMA IF NOT EXISTS audit;
CREATE TABLE IF NOT EXISTS audit.transaction_logs (
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
ALTER TABLE audit.transaction_logs ENABLE ROW LEVEL SECURITY;

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

-- 2. SOFT DELETE (Integridade de Dados)
ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.evolution_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. PERFORMANCE LOGÍSTICA (Estatísticas e Índices Parciais)
-- Usando UUID_GENERATE_V4() ao invés de datas para evitar erros de imutabilidade em índices parciais, 
-- ou focando apenas no status de deleção que é estável.
CREATE STATISTICS IF NOT EXISTS stts_meal_logs_patient_clinic (dependencies) ON patient_id, clinic_id FROM public.meal_logs;
CREATE INDEX IF NOT EXISTS idx_meal_logs_active ON public.meal_logs (patient_id, logged_at) WHERE (deleted_at IS NULL);

-- 4. CONSTRAINTS DE INTEGRIDADE
ALTER TABLE public.meal_logs ADD CONSTRAINT check_calories_positive CHECK (calories >= 0);
ALTER TABLE public.evolution_logs ADD CONSTRAINT check_weight_positive CHECK (weight > 0);

-- 5. ATIVAÇÃO DE TRIGGERS DE AUDITORIA
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

-- 6. TUNING DE MANUTENÇÃO (Postgres Logistics)
ALTER TABLE public.meal_logs SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.evolution_logs SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
;
