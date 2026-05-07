-- 1. Create a safe function to get user role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role_safe()
RETURNS public.user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Drop existing problematic policies on profiles
DROP POLICY IF EXISTS "p1_own_profile" ON public.profiles;
DROP POLICY IF EXISTS "p2_clinic_members" ON public.profiles;
DROP POLICY IF EXISTS "p3_admin_view" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- 3. Re-implement clean, non-recursive policies

-- Everyone can see their own profile
CREATE POLICY "p1_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Nutritionists can see all profiles in their clinic
CREATE POLICY "p2_nutritionists_view_clinic"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe() = 'NUTRITIONIST' 
  AND clinic_id = get_user_clinic_safe()
);

-- Admins can see all profiles in their clinic
CREATE POLICY "p3_admins_view_clinic"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe() = 'ADMIN' 
  AND clinic_id = get_user_clinic_safe()
);

-- Patients can see nutritionists in their clinic
CREATE POLICY "p4_patients_view_nutritionists"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  get_user_role_safe() = 'PATIENT' 
  AND role = 'NUTRITIONIST' 
  AND clinic_id = get_user_clinic_safe()
);

-- Standard insert/update policies (non-recursive)
CREATE POLICY "p5_insert_own_profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "p6_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can update any profile in their clinic
CREATE POLICY "p7_admins_update_clinic_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  get_user_role_safe() = 'ADMIN' 
  AND clinic_id = get_user_clinic_safe()
);
;
