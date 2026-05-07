-- Mark invited nutritionists as approved once they finish the invite flow.

CREATE OR REPLACE FUNCTION public.accept_current_invite()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.nutritionist_details nd
  SET status = 'APPROVED'::public.nutritionist_status
  FROM public.profiles p
  WHERE nd.id = auth.uid()
    AND p.id = nd.id
    AND p.role = 'NUTRITIONIST'
    AND nd.status = 'PENDING';
END;
$$;

REVOKE ALL ON FUNCTION public.accept_current_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_current_invite() TO authenticated;

UPDATE public.nutritionist_details nd
SET status = 'APPROVED'::public.nutritionist_status
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE nd.id = p.id
  AND p.role = 'NUTRITIONIST'
  AND nd.status = 'PENDING'
  AND u.confirmed_at IS NOT NULL
  AND u.last_sign_in_at IS NOT NULL;
