-- supabase/migrations/20260504000006_state_of_the_art_db_features.sql

-- 1. BUSCA INTELIGENTE
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criando uma função IMMUTABLE para o índice, conforme exigência do Postgres
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
RETURNS text AS $$
    SELECT public.unaccent($1);
$$ LANGUAGE sql IMMUTABLE PARALLEL SAFE SET search_path = public;

-- Índice GIST para busca por nome de paciente (Fuzzy Search) usando a função imutável
CREATE INDEX IF NOT EXISTS idx_profiles_name_fuzzy ON public.profiles USING gist (public.immutable_unaccent(name) gist_trgm_ops);

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
        public.immutable_unaccent(name) % public.immutable_unaccent(search_term)
        OR public.immutable_unaccent(name) ILIKE '%' || public.immutable_unaccent(search_term) || '%'
      )
    ORDER BY similarity(public.immutable_unaccent(name), public.immutable_unaccent(search_term)) DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. ANALYTICS DE ALTA PERFORMANCE: Materialized Views
CREATE MATERIALized VIEW IF NOT EXISTS public.mv_gamification_ranking AS
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_gamification_ranking_id ON public.mv_gamification_ranking (patient_id);
CREATE INDEX IF NOT EXISTS idx_mv_gamification_ranking_clinic ON public.mv_gamification_ranking (clinic_id);

CREATE OR REPLACE FUNCTION public.refresh_gamification_ranking()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_gamification_ranking;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CICLO DE VIDA DO DADO: Cold Storage / Archiving
CREATE SCHEMA IF NOT EXISTS archive;
DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'archive' AND tablename = 'meal_logs_history') THEN
        CREATE TABLE archive.meal_logs_history AS SELECT * FROM public.meal_logs WHERE FALSE;
    END IF;
EXCEPTION WHEN others THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.archive_old_data()
RETURNS void AS $$
BEGIN
    WITH moved_rows AS (
        DELETE FROM public.meal_logs
        WHERE logged_at < NOW() - INTERVAL '2 years'
        RETURNING *
    )
    INSERT INTO archive.meal_logs_history SELECT * FROM moved_rows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. SEGURANÇA RESILIENTE: Preparação para Exportação WORM
ALTER TABLE audit.unified_logs ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_unified_logs_pending_export ON audit.unified_logs (executed_at) WHERE (exported_at IS NULL);

-- 5. CONSTRAINTS ADICIONAIS DE INTEGRIDADE
ALTER TABLE public.patient_details DROP CONSTRAINT IF EXISTS check_not_self_nutritionist;
ALTER TABLE public.patient_details ADD CONSTRAINT check_not_self_nutritionist CHECK (id <> nutritionist_id);

-- 6. PERMISSÕES
REVOKE EXECUTE ON FUNCTION public.search_patients(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_patients(TEXT, UUID) TO authenticated;
;
