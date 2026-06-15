-- RPC: expõe o email de um paciente para o NUTRICIONISTA responsável
-- (ou o ADMIN da mesma clínica). O email vive em auth.users, não em
-- public.profiles, portanto não é acessível via RLS direto no frontend.
-- Dado de contato operacional (não clínico). RBAC estrito:
--   - NUTRITIONIST: apenas pacientes da própria carteira (is_my_patient)
--   - ADMIN: apenas pacientes da própria clínica
CREATE OR REPLACE FUNCTION public.get_patient_email(p_patient_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
BEGIN
  -- 1. Exigir autenticação
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Autorizar: nutricionista dono do paciente OU admin da mesma clínica.
  --    Posse checada direto em patient_details para não depender de helpers
  --    opcionais (is_my_patient) que podem não existir no ambiente.
  IF NOT (
    (
      get_user_role_safe() = 'NUTRITIONIST'
      AND EXISTS (
        SELECT 1 FROM public.patient_details pd
        WHERE pd.id = p_patient_id AND pd.nutritionist_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = p_patient_id
        AND p.role = 'PATIENT'
        AND get_user_role_safe() = 'ADMIN'
        AND p.clinic_id = get_user_clinic_safe()
    )
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Retornar o email da identidade interna do Supabase
  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = p_patient_id;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_patient_email(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_patient_email(uuid) FROM anon, public;
