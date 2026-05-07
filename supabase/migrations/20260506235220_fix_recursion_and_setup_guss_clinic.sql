-- 1. Criar a clínica 'Guss' com um ID específico
DO $$
DECLARE
    v_clinic_id UUID := uuid_generate_v4();
    v_user_id UUID := '6f37d622-e898-4b12-8fbd-0dd662940c19'; -- ID do seu usuário 'guss'
BEGIN
    -- Cria a clínica
    INSERT INTO public.clinics (id, name)
    VALUES (v_clinic_id, 'Guss')
    ON CONFLICT DO NOTHING;

    -- Vincula seu usuário a esta clínica
    UPDATE public.profiles 
    SET clinic_id = v_clinic_id 
    WHERE id = v_user_id;
END $$;

-- 2. Corrigir a RECURSÃO INFINITA no RLS
-- O problema: SELECT em profiles dentro de uma política de profiles = Loop.
-- Solução: Usar uma política que não dependa de subqueries na mesma tabela para o acesso básico.

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Clinic members can read each other" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible within same clinic" ON public.profiles;

-- Regra 1: Todo usuário autenticado pode ver seu PRÓPRIO perfil (Sem recursão)
CREATE POLICY "p1_own_profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Regra 2: Usuários podem ver outros da mesma clínica
-- Para evitar recursão, usamos a função security definer que já criamos, 
-- mas garantimos que ela não entre em loop.
CREATE OR REPLACE FUNCTION public.get_user_clinic_safe()
RETURNS UUID AS $$
    -- Busca direto na tabela ignorando RLS para evitar recursão
    SELECT clinic_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE POLICY "p2_clinic_members" ON public.profiles 
FOR SELECT USING (clinic_id = public.get_user_clinic_safe());

-- Regra 3: Admins podem ver tudo na clínica deles
CREATE POLICY "p3_admin_view" ON public.profiles 
FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' 
    AND clinic_id = public.get_user_clinic_safe()
);
;
