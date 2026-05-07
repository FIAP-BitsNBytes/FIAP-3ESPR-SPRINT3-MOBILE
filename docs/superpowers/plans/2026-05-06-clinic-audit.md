# Clinic Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a secure audit log interface for Admins to track data changes within their clinic.

**Architecture:** 
1. Secure the `audit.unified_logs` table using RLS.
2. Create a `useAuditLogs` hook for data fetching.
3. Build a `AuditLogsScreen` with a timeline UI and detailed diff modal.

**Tech Stack:** Supabase (PostgreSQL RLS), Expo Router, Lucide Icons, JSON viewer logic.

---

### Task 1: Database Security - Audit RLS

**Files:**
- Create: `supabase/migrations/20260506235902_secure_audit_logs.sql`

- [ ] **Step 1: Create migration to enable RLS and policies for audit logs**

```sql
-- Migration: secure_audit_logs
-- Date: 2026-05-06
-- Fixes: Enables RLS on audit tables and restricts access to clinic Admins.

-- 1. Enable RLS
ALTER TABLE audit.unified_logs ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy for Admins
-- Using the get_user_clinic() function defined in previous migrations
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

-- 3. Apply to partitions (existing and future logic)
-- Note: In Supabase/Postgres, policies on parent tables apply to partitions if created correctly.
-- We explicitly enable for the current partition to be safe.
ALTER TABLE audit.unified_logs_2026_05 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view clinic audit logs partition 05" ON audit.unified_logs_2026_05 FOR SELECT USING (clinic_id = get_user_clinic());

-- 4. Revoke access from non-admins
REVOKE ALL ON audit.unified_logs FROM public, authenticated, anon;
GRANT SELECT ON audit.unified_logs TO authenticated;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/20260506235902_secure_audit_logs.sql
git commit -m "security(db): secure audit logs with RLS"
```

### Task 2: Create `useAuditLogs` Hook

**Files:**
- Create: `src/features/admin/hooks/useAuditLogs.ts`

- [ ] **Step 1: Implement the hook to fetch from the `audit` schema**

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';

export interface AuditLog {
  id: string;
  executed_at: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor_role: string;
  old_data: any;
  new_data: any;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('unified_logs' as any) // Using 'as any' because it's in audit schema
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data as AuditLog[]);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  return { logs, isLoading, refresh: fetchLogs };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/features/admin/hooks/useAuditLogs.ts
git commit -m "feat(admin): add useAuditLogs hook"
```

### Task 3: Audit UI - Screen and Navigation

**Files:**
- Create: `src/features/admin/screens/AuditLogsScreen.tsx`
- Create: `src/app/(tabs)/clinic-audit.tsx`
- Modify: `src/features/admin/screens/ClinicSettingsScreen.tsx`

- [ ] **Step 1: Create `AuditLogsScreen` with timeline UI**
- [ ] **Step 2: Register the route in `src/app/(tabs)/clinic-audit.tsx`**
- [ ] **Step 3: Add entry button in `ClinicSettingsScreen`**

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(admin): implement audit log screen and navigation"
```

### Task 4: Validation

- [ ] **Step 1: Verify RLS prevents non-admins from seeing logs**
- [ ] **Step 2: Verify timeline renders correctly with real data**
- [ ] **Step 3: Final Commit**
