-- supabase/migrations/20260504000005_enterprise_audit_partitioning.sql

-- 1. LIMPEZA DA AUDITORIA ANTERIOR (Migração para o novo modelo)
DROP TRIGGER IF EXISTS audit_trigger ON public.meal_logs;
DROP TRIGGER IF EXISTS audit_trigger ON public.evolution_logs;
DROP TRIGGER IF EXISTS audit_trigger ON public.appointments;
DROP TRIGGER IF EXISTS audit_trigger ON public.patient_details;
DROP TABLE IF EXISTS audit.transaction_logs;

-- 2. NOVA ESTRUTURA DE AUDITORIA: Particionada por Tempo
-- Criamos a tabela mestra de auditoria
CREATE TABLE audit.unified_logs (
    id BIGSERIAL,
    executed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    clinic_id UUID NOT NULL, -- Rastreabilidade de Clínica em TODOS os logs
    actor_id UUID NOT NULL,   -- Quem gerou (auth.uid())
    actor_role TEXT NOT NULL, -- Qual o papel no momento da ação
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    client_ip TEXT,
    user_agent TEXT,
    PRIMARY KEY (executed_at, id) -- A chave primária deve incluir a coluna de partição
) PARTITION BY RANGE (executed_at);

-- 3. SISTEMA DE AUTO-PARTICIONAMENTO (Auto-provisioning)
-- Função para criar partições automaticamente para o mês atual e o próximo
CREATE OR REPLACE FUNCTION audit.create_audit_partitions() 
RETURNS void AS $$
DECLARE
    start_date DATE := date_trunc('month', now());
    end_date DATE;
    partition_name TEXT;
BEGIN
    FOR i IN 0..1 LOOP -- Cria para este mês e o próximo
        end_date := start_date + interval '1 month';
        partition_name := 'unified_logs_' || to_char(start_date, 'YYYY_MM');
        
        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = partition_name) THEN
            EXECUTE format('CREATE TABLE audit.%I PARTITION OF audit.unified_logs FOR VALUES FROM (%L) TO (%L)', 
                partition_name, start_date, end_date);
            
            -- Adiciona índices em árvore para busca rápida na partição
            EXECUTE format('CREATE INDEX %I ON audit.%I USING btree (executed_at, clinic_id, actor_id)', 
                'idx_' || partition_name || '_search', partition_name);
        END IF;
        
        start_date := end_date;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provisiona as primeiras partições imediatamente
SELECT audit.create_audit_partitions();

-- 4. TRIGGER DE AUDITORIA COM RASTREABILIDADE TOTAL
CREATE OR REPLACE FUNCTION audit.process_enterprise_audit() RETURNS TRIGGER AS $body$
DECLARE
    v_clinic_id UUID;
    v_actor_role TEXT;
BEGIN
    -- Captura o contexto do autor via profile
    SELECT clinic_id, role::text INTO v_clinic_id, v_actor_role 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- Se não encontrar no profile (ex: sistema/service_role), usa o valor da linha se disponível
    IF v_clinic_id IS NULL THEN
        IF (TG_OP = 'DELETE') THEN v_clinic_id := OLD.clinic_id;
        ELSE v_clinic_id := NEW.clinic_id;
        END IF;
        v_actor_role := 'SYSTEM';
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, old_data, new_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), inet_client_addr()::text);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, old_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), inet_client_addr()::text);
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, new_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), inet_client_addr()::text);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$body$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = audit, public;

-- 5. RE-APLICAÇÃO NAS TABELAS (Agora com rastro de clínica e ator)
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

-- 6. SEGURANÇA BANCÁRIA: Bloqueio de Alteração em Logs
-- Impede qualquer UPDATE ou DELETE na tabela de auditoria (Imutabilidade)
CREATE OR REPLACE FUNCTION audit.prevent_audit_tampering() RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'AUDIT_LOGS_ARE_IMMUTABLE: Auditoria não pode ser alterada ou excluída.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutable_audit BEFORE UPDATE OR DELETE ON audit.unified_logs
FOR EACH ROW EXECUTE PROCEDURE audit.prevent_audit_tampering();
