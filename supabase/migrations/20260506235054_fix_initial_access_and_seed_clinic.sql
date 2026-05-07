-- 1. Criar uma Clínica Padrão para evitar dados órfãos e permitir acesso inicial
DO $$
DECLARE
    v_clinic_id UUID := '00000000-0000-0000-0000-000000000001'; -- UUID estático para Clínica Global/Padrão
BEGIN
    INSERT INTO public.clinics (id, name)
    VALUES (v_clinic_id, 'Clínica NutriApp Padrão')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Vincular usuários órfãos (que não têm clinic_id) à clínica padrão
    UPDATE public.profiles 
    SET clinic_id = v_clinic_id 
    WHERE clinic_id IS NULL;
END $$;

-- 3. Corrigir as políticas de RLS para permitir que o usuário leia seu PRÓPRIO perfil
-- Atualmente, a leitura depende de get_user_clinic(), mas o perfil precisa ser lido 
-- justamente para a função get_user_clinic() funcionar. Isso gera uma recursão circular no RLS.

-- Remover política circular
DROP POLICY IF EXISTS "Profiles visible within same clinic" ON public.profiles;

-- Criar políticas separadas e seguras
-- A: Usuário sempre pode ler seu próprio registro (Essencial para login/contexto)
CREATE POLICY "Users can read own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- B: Usuário pode ler perfis da mesma clínica (Para nutricionistas verem pacientes e vice-versa)
CREATE POLICY "Clinic members can read each other" ON public.profiles 
FOR SELECT USING (
    clinic_id = (SELECT p.clinic_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- C: Garantir que usuários novos possam ser criados com clínica padrão se necessário
-- (Ajustando a trigger handle_new_user para usar a clínica padrão se não informada)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_default_clinic_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO public.profiles (id, name, role, clinic_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'PATIENT'::user_role),
    COALESCE((NEW.raw_user_meta_data->>'clinic_id')::uuid, v_default_clinic_id)
  );
  RETURN NEW;
END;
$$;
;
