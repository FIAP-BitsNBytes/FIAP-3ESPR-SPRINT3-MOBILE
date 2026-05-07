-- Allow invite-created auth profiles to be linked to a clinic before audit logging.
--
-- Auth invite creates auth.users first, which fires public.handle_new_user().
-- At that point the profile can briefly have clinic_id = NULL. The invite Edge
-- Function immediately upserts the same profile with the caller clinic_id, but
-- the audit trigger used to fail first because audit.unified_logs.clinic_id is
-- NOT NULL.

CREATE OR REPLACE FUNCTION audit.process_enterprise_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'audit', 'public'
AS $$
DECLARE
    v_clinic_id UUID;
    v_actor_role TEXT;
BEGIN
    SELECT clinic_id, role::text
    INTO v_clinic_id, v_actor_role
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_clinic_id IS NULL THEN
        IF (TG_OP = 'DELETE') THEN
            v_clinic_id := OLD.clinic_id;
        ELSE
            v_clinic_id := NEW.clinic_id;
        END IF;

        v_actor_role := 'SYSTEM';
    END IF;

    IF v_clinic_id IS NULL THEN
        RETURN NULL;
    END IF;

    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, old_data, new_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW), inet_client_addr()::text);
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, old_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD), inet_client_addr()::text);
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.unified_logs (clinic_id, actor_id, actor_role, table_name, record_id, action, new_data, client_ip)
        VALUES (v_clinic_id, auth.uid(), v_actor_role, TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW), inet_client_addr()::text);
    END IF;

    RETURN NULL;
END;
$$;
