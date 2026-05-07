-- 1. Otimizar funções de segurança para usar Memoização de Sessão (config_settings)
-- O Supabase permite salvar variáveis na sessão. Vamos usá-las para evitar SELECTs repetidos no RLS.

CREATE OR REPLACE FUNCTION public.get_user_clinic()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _clinic_id uuid;
BEGIN
  -- Tenta pegar do cache da sessão (rápido)
  _clinic_id := current_setting('app.current_clinic_id', true)::uuid;
  
  IF _clinic_id IS NULL THEN
    -- Busca no banco (apenas uma vez por sessão/requisição se bem implementado no cliente)
    SELECT clinic_id INTO _clinic_id FROM public.profiles WHERE id = auth.uid();
    -- Salva na sessão (opcional, dependendo de como o PostgREST gerencia o pooling)
    -- PERFORM set_config('app.current_clinic_id', _clinic_id::text, true);
  END IF;
  
  RETURN _clinic_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role public.user_role;
BEGIN
  SELECT role INTO _role FROM public.profiles WHERE id = auth.uid();
  RETURN _role;
END;
$$;

-- 2. Garantir que as tabelas tenham índices nos campos de filtro do RLS
CREATE INDEX IF NOT EXISTS idx_meal_logs_patient_id ON public.meal_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_meal_logs_clinic_id ON public.meal_logs(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_profiles_id_clinic_id ON public.profiles(id, clinic_id);
;
