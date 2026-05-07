-- Função para atualizar nome e telefone (em auth.users e public.profiles)
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_name  text,
  p_phone text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Validar se o usuário está autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Atualizar auth.users (tabela interna do Supabase)
  -- Isso garante que o telefone fique correto na identidade do usuário
  UPDATE auth.users
  SET phone = p_phone,
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{name}',
        to_jsonb(p_name)
      ),
      updated_at = now()
  WHERE id = auth.uid();

  -- 3. Atualizar public.profiles
  UPDATE public.profiles
  SET name = p_name,
      phone = p_phone,
      updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Garantir permissões de execução
GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_profile(text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text) TO authenticated;
;
