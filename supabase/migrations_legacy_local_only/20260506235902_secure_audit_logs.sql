-- Migration: secure_audit_logs
-- Date: 2026-05-06
-- Fixes: Enables RLS on audit tables and restricts access to clinic Admins.

-- 1. Enable RLS
ALTER TABLE audit.unified_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Admins
CREATE POLICY "Admins view clinic audit logs"
  ON audit.unified_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'ADMIN' 
        AND clinic_id = audit.unified_logs.clinic_id
    )
  );

-- 3. Apply to partitions (explicitly for current month)
ALTER TABLE audit.unified_logs_2026_05 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view clinic audit logs partition 05" 
  ON audit.unified_logs_2026_05 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
        AND role = 'ADMIN' 
        AND clinic_id = audit.unified_logs_2026_05.clinic_id
    )
  );

-- 4. Revoke access from non-admins
REVOKE ALL ON audit.unified_logs FROM public, authenticated, anon;
GRANT SELECT ON audit.unified_logs TO authenticated;
