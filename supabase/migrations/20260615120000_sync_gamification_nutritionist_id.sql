-- ---------------------------------------------------------------------
-- Fix: admin "Pacientes por nutricionista" sempre vazio.
--
-- Causa raiz:
--   A tela de admin (useNutritionistPatients) filtra
--   gamification_stats.nutritionist_id, pois o admin NÃO tem acesso a
--   patient_details (RLS clínica). Esse vínculo é o canal denormalizado
--   pensado para o admin (ver 20260611150000, seção 7).
--   Porém gamification_stats.nutritionist_id nunca era populado:
--     - init_gamification_on_profile() cria a linha só com
--       (patient_id, clinic_id) na criação do perfil;
--     - o vínculo paciente↔nutricionista só nasce depois, em
--       patient_details.nutritionist_id (aceite do convite),
--       e nunca era propagado para gamification_stats.
--   Resultado: todas as linhas com nutritionist_id = NULL → admin via 0.
--
-- Correção:
--   1. Backfill a partir de patient_details (fonte da verdade).
--   2. Trigger em patient_details para manter sincronizado em mudanças
--      futuras de vínculo.
--   3. Trigger BEFORE INSERT em gamification_stats para cobrir ordenação
--      (linha criada quando o vínculo já existe).
-- ---------------------------------------------------------------------

-- 1. Backfill das linhas existentes ------------------------------------
UPDATE public.gamification_stats gs
SET nutritionist_id = pd.nutritionist_id
FROM public.patient_details pd
WHERE pd.id = gs.patient_id
  AND gs.nutritionist_id IS DISTINCT FROM pd.nutritionist_id
  AND pd.nutritionist_id IS NOT NULL;

-- 2. patient_details → gamification_stats (vínculo muda no aceite) ------
CREATE OR REPLACE FUNCTION public.sync_gamification_nutritionist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.gamification_stats
  SET nutritionist_id = NEW.nutritionist_id
  WHERE patient_id = NEW.id
    AND nutritionist_id IS DISTINCT FROM NEW.nutritionist_id;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_gamification_nutritionist() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_sync_gamification_nutritionist ON public.patient_details;
CREATE TRIGGER trg_sync_gamification_nutritionist
  AFTER INSERT OR UPDATE OF nutritionist_id ON public.patient_details
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_gamification_nutritionist();

-- 3. gamification_stats herda o vínculo no INSERT (cobre ordenação) -----
CREATE OR REPLACE FUNCTION public.fill_gamification_nutritionist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.nutritionist_id IS NULL THEN
    SELECT pd.nutritionist_id
    INTO NEW.nutritionist_id
    FROM public.patient_details pd
    WHERE pd.id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fill_gamification_nutritionist() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_fill_gamification_nutritionist ON public.gamification_stats;
CREATE TRIGGER trg_fill_gamification_nutritionist
  BEFORE INSERT ON public.gamification_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.fill_gamification_nutritionist();
