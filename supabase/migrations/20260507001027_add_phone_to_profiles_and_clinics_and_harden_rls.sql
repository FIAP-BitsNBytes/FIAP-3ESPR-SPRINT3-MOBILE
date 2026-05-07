-- 1. Add phone column to profiles and clinics
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS phone text;

-- 2. Update RLS policies for clinics (Allow ADMIN to update their clinic)
DROP POLICY IF EXISTS "Users view own clinic" ON public.clinics;

CREATE POLICY "Users view own clinic"
ON public.clinics
FOR SELECT
TO authenticated
USING (id = get_user_clinic());

CREATE POLICY "Admins update own clinic"
ON public.clinics
FOR UPDATE
TO authenticated
USING (
  id = get_user_clinic() 
  AND get_user_role() = 'ADMIN'
);

-- 3. Standardize profile update (already exists p6_update_own_profile, but ensuring it covers phone)
-- The existing policy p6_update_own_profile on public.profiles:
-- USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
-- is sufficient for users to update their own name and phone.
;
