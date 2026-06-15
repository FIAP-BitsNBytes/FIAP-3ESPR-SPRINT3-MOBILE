-- Expõe a foto da refeição (prova de consumo) nas RPCs de plano.
--
-- O paciente já podia anexar foto à refeição livre; agora também anexa ao
-- registrar um item do plano (gravada em meal_logs.photo_path). Para exibir a
-- prova — tanto na visão do paciente quanto na do nutricionista — as RPCs
-- get_today_plan e get_patient_plan_summary passam a retornar photo_path.
--
-- CREATE OR REPLACE não permite alterar as colunas de retorno (RETURNS TABLE),
-- então é necessário DROP + recriar. REVOKE/GRANT são reaplicados.

DROP FUNCTION IF EXISTS public.get_today_plan(date);

CREATE FUNCTION public.get_today_plan(
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  item_id         uuid,
  meal_time       public.meal_time_type,
  food_name       text,
  prescribed_qty  numeric,
  prescribed_unit public.measurement_unit,
  prescribed_cal  integer,
  purpose         text,
  sequence        integer,
  log_id          uuid,
  actual_qty      numeric,
  actual_unit     public.measurement_unit,
  actual_cal      integer,
  logged_at       timestamptz,
  xp_earned       integer,
  log_notes       text,
  photo_path      text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid  uuid := auth.uid();
  v_role user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = v_uid;

  IF v_role != 'PATIENT' THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  RETURN QUERY
  SELECT
    mpi.id                    AS item_id,
    mpi.meal_time,
    mpi.food_name,
    mpi.quantity              AS prescribed_qty,
    mpi.unit                  AS prescribed_unit,
    mpi.calories              AS prescribed_cal,
    mpi.purpose,
    mpi.sequence,
    ml.id                     AS log_id,
    ml.quantity               AS actual_qty,
    ml.unit                   AS actual_unit,
    ml.calories               AS actual_cal,
    ml.logged_at,
    COALESCE(ml.xp_earned, 0) AS xp_earned,
    ml.notes                  AS log_notes,
    ml.photo_path             AS photo_path
  FROM public.meal_plan_items mpi
  JOIN public.meal_plans mp ON mp.id = mpi.plan_id
  LEFT JOIN public.meal_logs ml
    ON ml.plan_item_id    = mpi.id
   AND ml.logged_at::date = p_date
   AND ml.deleted_at     IS NULL
  WHERE mp.patient_id  = v_uid
    AND mpi.is_active  = true
    AND mp.is_active   = true
    AND mp.start_date <= p_date
    AND (mp.end_date IS NULL OR mp.end_date >= p_date)
  ORDER BY mpi.sequence, mpi.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_today_plan(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_today_plan(date) TO authenticated;


DROP FUNCTION IF EXISTS public.get_patient_plan_summary(uuid, date);

CREATE FUNCTION public.get_patient_plan_summary(
  p_patient_id uuid,
  p_date       date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  plan_id         uuid,
  plan_title      text,
  item_id         uuid,
  meal_time       public.meal_time_type,
  food_name       text,
  prescribed_qty  numeric,
  prescribed_unit public.measurement_unit,
  prescribed_cal  integer,
  purpose         text,
  sequence        integer,
  log_id          uuid,
  actual_qty      numeric,
  actual_unit     public.measurement_unit,
  actual_cal      integer,
  logged_at       timestamptz,
  xp_earned       integer,
  adherence_pct   numeric,
  photo_path      text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid       uuid := auth.uid();
  v_clinic_id uuid;
  v_role      user_role;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  SELECT role, clinic_id INTO v_role, v_clinic_id
  FROM public.profiles WHERE id = v_uid;

  IF v_role NOT IN ('NUTRITIONIST', 'ADMIN') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_patient_id AND clinic_id = v_clinic_id
  ) THEN
    RAISE EXCEPTION 'NOT_FOUND: patient not in your clinic' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  SELECT
    mp.id                                             AS plan_id,
    mp.title                                          AS plan_title,
    mpi.id                                            AS item_id,
    mpi.meal_time,
    mpi.food_name,
    mpi.quantity                                      AS prescribed_qty,
    mpi.unit                                          AS prescribed_unit,
    mpi.calories                                      AS prescribed_cal,
    mpi.purpose,
    mpi.sequence,
    ml.id                                             AS log_id,
    ml.quantity                                       AS actual_qty,
    ml.unit                                           AS actual_unit,
    ml.calories                                       AS actual_cal,
    ml.logged_at,
    COALESCE(ml.xp_earned, 0)                        AS xp_earned,
    CASE
      WHEN ml.id IS NULL    THEN 0::numeric
      ELSE LEAST(ROUND((ml.quantity / mpi.quantity) * 100, 1), 200)
    END                                               AS adherence_pct,
    ml.photo_path                                     AS photo_path
  FROM public.meal_plan_items mpi
  JOIN public.meal_plans mp ON mp.id = mpi.plan_id
  LEFT JOIN public.meal_logs ml
    ON ml.plan_item_id    = mpi.id
   AND ml.logged_at::date = p_date
   AND ml.deleted_at     IS NULL
  WHERE mp.patient_id   = p_patient_id
    AND mp.clinic_id    = v_clinic_id
    AND mpi.is_active   = true
    AND mp.is_active    = true
    AND mp.start_date  <= p_date
    AND (mp.end_date IS NULL OR mp.end_date >= p_date)
  ORDER BY mpi.sequence, mpi.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.get_patient_plan_summary(uuid, date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_patient_plan_summary(uuid, date) TO authenticated;
