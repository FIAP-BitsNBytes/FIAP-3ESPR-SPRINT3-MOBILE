-- supabase/migrations/20260504000006_state_of_the_art_db_features.sql

-- 1. BUSCA INTELIGENTE: Fuzzy Search com Trigrams (Nível Logística/UX)
-- Permite busca rápida de pacientes e alimentos ignorando acentos e erros de digitação
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Índice GIST para busca por nome de paciente (Fuzzy Search)
CREATE INDEX IF NOT EXISTS idx_profiles_name_fuzzy ON public.profiles USING gist (unaccent(name) gist_trgm_ops);

-- Função de busca otimizada para o App
CREATE OR REPLACE FUNCTION public.search_patients(search_term TEXT, p_clinic_id UUID)
RETURNS SETOF public.profiles AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.profiles
    WHERE clinic_id = p_clinic_id
      AND role = 'PATIENT'
      AND (
        unaccent(name) % unaccent(search_term) -- Busca por similaridade
        OR unaccent(name) ILIKE '%' || unaccent(search_term) || '%' -- Busca por substring
      )
    ORDER BY similarity(unaccent(name), unaccent(search_term)) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. ANALYTICS DE ALTA PERFORMANCE: Materialized Views (Nível BI)
-- Ranking de Gamificação calculado em background para não travar o banco
CREATE MATERIALized VIEW public.mv_gamification_ranking AS
SELECT 
    gs.patient_id,
    p.name as patient_name,
    gs.clinic_id,
    gs.level,
    gs.experience,
    gs.points,
    gs.streak_days,
    RANK() OVER (PARTITION BY gs.clinic_id ORDER BY gs.experience DESC) as clinic_rank
FROM public.gamification_stats gs
JOIN public.profiles p ON p.id = gs.patient_id
WITH NO DATA;

-- Índice único na MV para permitir Refresh Concurrent (sem travar leitura)
CREATE UNIQUE INDEX idx_mv_gamification_ranking_id ON public.mv_gamification_ranking (patient_id);
CREATE INDEX idx_mv_gamification_ranking_clinic ON public.mv_gamification_ranking (clinic_id);

-- Função para atualizar o ranking (pode ser chamada via Cron ou Trigger)
CREATE OR REPLACE FUNCTION public.refresh_gamification_ranking()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_gamification_ranking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CICLO DE VIDA DO DADO: Cold Storage / Archiving
-- Criamos um schema para dados históricos comprimidos
CREATE SCHEMA IF NOT EXISTS archive;

-- Tabela de histórico de refeições (Estrutura idêntica, mas otimizada para storage)
CREATE TABLE archive.meal_logs_history AS SELECT * FROM public.meal_logs WHERE FALSE;

-- Função de arquivamento automático (Move dados com mais de 2 anos)
CREATE OR REPLACE FUNCTION public.archive_old_data()
RETURNS void AS $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Move refeições antigas para o archive
    WITH moved_rows AS (
        DELETE FROM public.meal_logs
        WHERE logged_at < NOW() - INTERVAL '2 years'
        RETURNING *
    )
    INSERT INTO archive.meal_logs_history SELECT * FROM moved_rows;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RAISE NOTICE 'Arquivados % registros de meal_logs.', row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SEGURANÇA RESILIENTE: Preparação para Exportação WORM (Off-site Audit)
-- Adiciona um marcador de exportação para que a Edge Function saiba o que já foi enviado ao Storage Externo
ALTER TABLE audit.unified_logs ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_unified_logs_pending_export ON audit.unified_logs (executed_at) WHERE (exported_at IS NULL);

-- 5. CONSTRAINTS ADICIONAIS DE INTEGRIDADE (DDD)
-- Garante que o nutricionista não pode ser paciente dele mesmo na mesma clínica em certas operações
ALTER TABLE public.patient_details ADD CONSTRAINT check_not_self_nutritionist CHECK (id <> nutritionist_id);

-- 6. PERMISSÕES DE EXECUÇÃO
REVOKE EXECUTE ON FUNCTION public.search_patients(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_patients(TEXT, UUID) TO authenticated;
