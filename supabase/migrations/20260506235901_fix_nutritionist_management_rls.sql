-- Migration: fix_nutritionist_management_rls
-- Date: 2026-05-06
-- Fixes: Multi-tenant leak in nutritionist_details where any admin could manage any nutritionist.

-- 1. Drop the old insecure policy
DROP POLICY IF EXISTS "Admins manage nutritionist accounts" ON public.nutritionist_details;

-- 2. Create a secure multi-tenant policy for Admins
CREATE POLICY "Admins manage clinic nutritionists"
  ON public.nutritionist_details
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() 
        AND role = 'ADMIN' 
        AND clinic_id = nutritionist_details.clinic_id
    )
  );

-- 3. Ensure patient_details is also strictly multi-tenant for Nutritionists
-- The existing policy "Patient/Nutri access details" in migration 0002 already checks clinic_id:
-- (auth.uid() = id OR auth.uid() = nutritionist_id) AND clinic_id = get_user_clinic()
-- This is secure.

-- 4. Audit: Log the security fix
COMMENT ON POLICY "Admins manage clinic nutritionists" ON public.nutritionist_details IS 'Ensures Admins only manage nutritionists within their own clinic.';
