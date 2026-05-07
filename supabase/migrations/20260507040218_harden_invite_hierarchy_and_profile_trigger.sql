-- Harden automatic profile creation and invite-linked gamification.
--
-- This keeps the invite hierarchy controlled by the Edge Function/service role:
-- ADMIN -> NUTRITIONIST -> PATIENT.
-- Direct Auth signup metadata must not be able to set role or clinic.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, clinic_id, phone)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    'PATIENT'::public.user_role,
    NULL,
    NEW.phone
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.init_gamification_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role = 'PATIENT' AND NEW.clinic_id IS NOT NULL THEN
    INSERT INTO public.gamification_stats (patient_id, clinic_id)
    VALUES (NEW.id, NEW.clinic_id)
    ON CONFLICT (patient_id) DO
    UPDATE SET clinic_id = EXCLUDED.clinic_id
    WHERE public.gamification_stats.clinic_id IS DISTINCT FROM EXCLUDED.clinic_id;
  ELSE
    DELETE FROM public.gamification_stats
    WHERE patient_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

DELETE FROM public.gamification_stats gs
USING public.profiles p
WHERE p.id = gs.patient_id
  AND p.role <> 'PATIENT';
