-- Pulled from remote (drift recovery): ranking RPC consulta gamification_stats
-- ao vivo (sem materialized view), scoped pela clínica do caller.
CREATE OR REPLACE FUNCTION public.get_gamification_ranking(p_limit integer DEFAULT 50)
RETURNS TABLE(
  patient_id   uuid,
  patient_name text,
  level        integer,
  experience   integer,
  points       integer,
  streak_days  integer,
  clinic_rank  bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_caller_clinic uuid;
  v_caller_role   user_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_caller_role, v_caller_clinic
  FROM public.profiles WHERE id = auth.uid();

  IF v_caller_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN: Only nutritionists and admins can view ranking'
    USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    gs.patient_id,
    p.name::text AS patient_name,
    gs.level,
    gs.experience,
    gs.points,
    gs.streak_days,
    RANK() OVER (ORDER BY gs.experience DESC, gs.points DESC)::bigint AS clinic_rank
  FROM public.gamification_stats gs
  JOIN public.profiles p ON p.id = gs.patient_id
  WHERE gs.clinic_id = v_caller_clinic
  ORDER BY gs.experience DESC, gs.points DESC
  LIMIT LEAST(p_limit, 100);
END;
$$;
