-- Fix: remove clinic_id from RETURNS TABLE of get_gamification_ranking.
-- PostgREST was generating SQL where clinic_id in the output type conflicted
-- with clinic_id columns from joined tables in its internal query wrapper,
-- causing "column reference 'clinic_id' is ambiguous" (HTTP 400).
-- The client never reads clinic_id from the result — it's filtered server-side.

DROP FUNCTION IF EXISTS public.get_gamification_ranking(integer);

CREATE FUNCTION public.get_gamification_ranking(
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  patient_id   uuid,
  patient_name text,
  level        integer,
  experience   integer,
  points       integer,
  streak_days  integer,
  clinic_rank  bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
  SELECT r.patient_id, r.patient_name,
         r.level, r.experience, r.points, r.streak_days, r.clinic_rank
  FROM public.mv_gamification_ranking r
  WHERE r.clinic_id = v_caller_clinic
  ORDER BY r.clinic_rank ASC
  LIMIT LEAST(p_limit, 100);
END;
$$;

REVOKE ALL ON FUNCTION public.get_gamification_ranking(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_gamification_ranking(integer) TO authenticated;
