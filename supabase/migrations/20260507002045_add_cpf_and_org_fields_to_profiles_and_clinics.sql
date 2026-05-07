-- 1. Add CPF to profiles and address/cnpj to clinics for better organization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS cnpj text;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS address text;

-- 2. Update update_user_profile function to handle CPF (only if currently null)
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_name  text,
  p_phone text,
  p_cpf   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_cpf text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT cpf INTO v_current_cpf FROM public.profiles WHERE id = auth.uid();

  -- Update auth.users metadata
  UPDATE auth.users
  SET phone = p_phone,
      raw_user_meta_data = jsonb_set(
        jsonb_set(
          COALESCE(raw_user_meta_data, '{}'::jsonb),
          '{name}',
          to_jsonb(p_name)
        ),
        '{cpf}',
        to_jsonb(COALESCE(v_current_cpf, p_cpf))
      ),
      updated_at = now()
  WHERE id = auth.uid();

  -- Update public.profiles
  UPDATE public.profiles
  SET name = p_name,
      phone = p_phone,
      -- Only update CPF if it was null (set once)
      cpf = COALESCE(v_current_cpf, p_cpf),
      updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- 3. Grant execute
GRANT EXECUTE ON FUNCTION public.update_user_profile(text, text, text) TO authenticated;
;
