-- 1. Update handle_new_user to include phone from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_default_clinic_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO public.profiles (id, name, role, clinic_id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'PATIENT'::user_role),
    COALESCE((NEW.raw_user_meta_data->>'clinic_id')::uuid, v_default_clinic_id),
    NEW.phone -- Use the phone field from auth.users
  );
  RETURN NEW;
END;
$$;

-- 2. Create a trigger to sync phone changes from auth.users to public.profiles
-- This handles updates made via Supabase Dashboard or other auth methods
CREATE OR REPLACE FUNCTION public.sync_user_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET phone = NEW.phone,
      updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_phone ON auth.users;
CREATE TRIGGER trg_sync_phone
  AFTER UPDATE OF phone ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_phone();
;
