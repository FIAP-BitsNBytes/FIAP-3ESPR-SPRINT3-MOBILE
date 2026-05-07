-- supabase/migrations/20260504000005_enterprise_audit_partitioning.sql

-- 1. LIMPEZA
DROP TRIGGER IF EXISTS audit_trigger ON public.meal_logs;
DROP TRIGGER IF EXISTS audit_trigger ON public.evolution_logs;
DROP TRIGGER IF EXISTS audit_trigger ON public.appointments;
DROP TRIGGER IF EXISTS audit_trigger ON public.patient_details;
DROP TRIGGER IF EXISTS audit_trigger ON public.profiles;

-- 2. NOVA ESTRUTURA PARTICIONADA
CREATE TABLE IF NOT EXISTS audit.unified_logs (
    id BIGSERIAL,
    executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    clinic_id UUID NOT NULL,
    actor_id UUID,
    actor_role TEXT,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    client_ip TEXT,
    PRIMARY KEY (executed_at, id)
) PARTITION BY RANGE (executed_at);

-- 3. AUTO-PROVISIONAMENTO DE PARTIÇÕES
CREATE OR REPLACE FUNCTION audit.create_audit_partitions() 
RETURNS void AS $$
DECLARE
    start_date DATE := date_trunc('month', now());
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..1 LOOP
        end_date := start_date + interval '1 month';
        partition_name := 'unified_logs_' || to_char(start_date, 'YYYY_MM');
        
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
            EXECUTE format('CREATE TABLE audit.%I PARTITION OF audit.unified_logs FOR VALUES FROM (%L) TO (%L)', 
                partition_name, start_date, end_date);
            EXECUTE format('CREATE INDEX %I ON audit.%I USING btree (executed_at, clinic_id, actor_id)', 
                'idx_' || partition_name || '_search', partition_name);
        END IF;
        
        start_date := end_date;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT audit.create_audit_partitions();

-- 4. PROCESSAMENTO DE AUDITORIA COM RASTREABILIDADE
CREATE OR REPLACE FUNCTION audit.process_enterprise_audit() RETURNS TRIGGER AS $body$
DECLARE
    v_clinic_id UUID;
    v_actor_role TEXT;
BEGIN
    -- Contexto do autor
    SELECT clinic_id, role::text INTO v_clinic_id, v_actor_role FROM public.profiles WHERE id = auth.uid();

    IF v_clinic_id IS NULL THEN
        IF (TG_OP = 'DELETE') THEN v_clinic_id := OLD.clinic_id; ELSE v_clinic_id := NEW.clinic_id; END IF;
        v_actor_role := 'SYSTEM';
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, old_data, new_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), inet_client_addr()::text);
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, old_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), inet_client_addr()::text);
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, new_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), inet_client_addr()::text);
    END IF;
    RETURN NULL;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = audit, public;

-- 5. ATIVAÇÃO
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('meal_logs', 'evolution_logs', 'appointments', 'patient_details', 'profiles')
    LOOP
        EXECUTE format('CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE PROCEDURE audit.process_enterprise_audit()', t);
    END LOOP;
END $$;
;
