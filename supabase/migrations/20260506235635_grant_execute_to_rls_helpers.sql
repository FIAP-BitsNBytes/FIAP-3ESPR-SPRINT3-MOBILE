-- Garantir que usuários autenticados possam executar as funções de auxílio do RLS
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_clinic() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_clinic_safe() TO authenticated;

-- Por segurança, revogar de usuários anônimos
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_clinic() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_role_safe() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_clinic_safe() FROM anon, public;

-- Re-garantir para authenticated (GRANT direto é mais específico que PUBLIC)
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_clinic() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_clinic_safe() TO authenticated;
;
