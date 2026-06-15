-- Habilita Realtime para as tabelas assinadas pelo app.
--
-- Causa raiz: a publicação `supabase_realtime` existia mas estava VAZIA, então
-- nenhum evento postgres_changes era emitido. Resultado: registros (refeição
-- livre, água, etc.) só apareciam após recarregar a página.
--
-- Correção:
--   1. Adiciona à publicação as tabelas que os hooks de realtime monitoram.
--   2. Define REPLICA IDENTITY FULL nessas tabelas. O default ('d') só inclui a
--      PK na imagem da linha antiga; isso quebra filtros de realtime por colunas
--      não-PK (ex.: patient_id, clinic_id) em eventos UPDATE/DELETE, porque o
--      Realtime precisa da coluna do filtro na linha antiga para casar o filtro.
--
-- Idempotente: cada ALTER PUBLICATION ... ADD TABLE é envolvido para tolerar
-- tabela já presente (evita erro em reaplicação).

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'meal_logs',
    'gamification_stats',
    'profiles',
    'appointments',
    'nutritionist_details',
    'clinics',
    'meal_plan_items',
    'meal_plans',
    'patient_details'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- REPLICA IDENTITY FULL: garante que filtros por colunas não-PK funcionem
    -- em UPDATE/DELETE.
    EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);

    -- Adiciona à publicação só se ainda não estiver (idempotente).
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
