-- 1. Initialize stats for existing patients
INSERT INTO public.gamification_stats (patient_id, clinic_id)
SELECT id, clinic_id 
FROM public.profiles 
WHERE role = 'PATIENT'
ON CONFLICT (patient_id) DO NOTHING;

-- 2. Enhance trigger to handle clinic_id updates
CREATE OR REPLACE FUNCTION public.init_gamification_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Se o cargo for paciente ou mudou para paciente
  IF NEW.role = 'PATIENT' THEN
    INSERT INTO public.gamification_stats (patient_id, clinic_id)
    VALUES (NEW.id, NEW.clinic_id)
    ON CONFLICT (patient_id) DO 
    UPDATE SET clinic_id = EXCLUDED.clinic_id 
    WHERE public.gamification_stats.clinic_id IS DISTINCT FROM EXCLUDED.clinic_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_init_gamification ON public.profiles;
CREATE TRIGGER trg_init_gamification
  AFTER INSERT OR UPDATE OF role, clinic_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.init_gamification_on_profile();
;
