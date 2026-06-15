-- RPC: expõe o email de um nutricionista para o ADMIN da mesma clínica.
-- O email vive em auth.users (não em public.profiles), portanto não é acessível
-- via RLS direto no frontend. Esta função SECURITY DEFINER faz a ponte com
-- verificação estrita de RBAC: apenas ADMIN da mesma clínica do nutricionista.
-- Dado operacional (não clínico), compatível com a regra de privacidade do admin.
CREATE OR REPLACE FUNCTION public.get_nutritionist_email(p_nutritionist_id uuid)
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

  -- 2. Autorizar: caller precisa ser ADMIN e o alvo precisa ser um
  --    NUTRITIONIST da mesma clínica do caller.
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_nutritionist_id
      AND p.role = 'NUTRITIONIST'
      AND get_user_role_safe() = 'ADMIN'
      AND p.clinic_id = get_user_clinic_safe()
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Retornar o email da identidade interna do Supabase
  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = p_nutritionist_id;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_nutritionist_email(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_nutritionist_email(uuid) FROM anon, public;
