# Hierarchical Invites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a secure invitation system where Admins can invite Nutritionists and Nutritionists can invite Patients via a Supabase Edge Function.

**Architecture:** A single Edge Function `invite-user` handles authorization, auth invitation, and database linking (clinic/nutritionist) using `service_role`.

**Tech Stack:** Supabase Edge Functions (Deno), React Native (Expo), Lucide Icons.

---

### Task 1: Supabase Edge Function `invite-user`

**Files:**
- Create: `supabase/functions/invite-user/index.ts`

- [ ] **Step 1: Create the Edge Function with proper logic**

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  try {
    const { email, name, role, crm_crn } = await req.json();

    // 1. Get caller info
    const { data: { user }, error: userErr } = await supabaseClient.auth.getUser();
    if (userErr || !user) throw new Error("Unauthorized");

    const { data: callerProfile } = await supabaseClient
      .from("profiles")
      .select("role, clinic_id")
      .eq("id", user.id)
      .single();

    if (!callerProfile) throw new Error("Caller profile not found");

    // 2. Validate hierarchy
    if (callerProfile.role === "ADMIN" && role !== "NUTRITIONIST") throw new Error("Invalid hierarchy");
    if (callerProfile.role === "NUTRITIONIST" && role !== "PATIENT") throw new Error("Invalid hierarchy");
    if (callerProfile.role === "PATIENT") throw new Error("Patients cannot invite anyone");

    // 3. Invite User to Auth
    const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { full_name: name }
    });
    if (inviteErr) throw inviteErr;

    const newUserId = inviteData.user.id;

    // 4. Create Profile
    const { error: profileErr } = await supabaseAdmin.from("profiles").insert({
      id: newUserId,
      name,
      role,
      clinic_id: callerProfile.clinic_id
    });
    if (profileErr) throw profileErr;

    // 5. Create Role Details
    if (role === "NUTRITIONIST") {
      await supabaseAdmin.from("nutritionist_details").insert({
        id: newUserId,
        crm_crn,
        status: "PENDING",
        clinic_id: callerProfile.clinic_id
      });
    } else if (role === "PATIENT") {
      await supabaseAdmin.from("patient_details").insert({
        id: newUserId,
        nutritionist_id: user.id,
        clinic_id: callerProfile.clinic_id
      });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
```

- [ ] **Step 2: Deploy the Edge Function (or simulate deployment)**
- [ ] **Step 3: Commit**

```bash
git add supabase/functions/invite-user/index.ts
git commit -m "feat(api): add invite-user edge function"
```

### Task 2: Create `useInviteUser` Hook

**Files:**
- Create: `src/shared/hooks/useInviteUser.ts`

- [ ] **Step 1: Implement the hook**

```typescript
import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';

export const useInviteUser = () => {
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUser = async (params: { email: string; name: string; role: 'NUTRITIONIST' | 'PATIENT'; crm_crn?: string }) => {
    setIsInviting(true);
    setError(null);
    try {
      const { data, error: funcErr } = await supabase.functions.invoke('invite-user', {
        body: params,
      });
      if (funcErr) throw funcErr;
      if (data?.error) throw new Error(data.error);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false };
    } finally {
      setIsInviting(false);
    }
  };

  return { inviteUser, isInviting, error };
};
```

- [ ] **Step 2: Commit**

```bash
git add src/shared/hooks/useInviteUser.ts
git commit -m "feat(shared): add useInviteUser hook"
```

### Task 3: Admin UI - Invite Nutritionist

**Files:**
- Modify: `src/features/admin/screens/NutritionistsScreen.tsx`

- [ ] **Step 1: Implement Invite Modal and FAB**
- [ ] **Step 2: Replace MOCK data with real query (integration)**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat(admin): add nutritionist invitation UI"
```

### Task 4: Nutritionist UI - Invite Patient

**Files:**
- Modify: `src/features/nutritionist/screens/PatientsScreen.tsx`

- [ ] **Step 1: Implement Invite Modal and FAB**
- [ ] **Step 2: Integrate with `useInviteUser` hook**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat(nutri): add patient invitation UI"
```

### Task 5: Final Validation & Audit

- [ ] **Step 1: Manual verification of RLS and Function flows**
- [ ] **Step 2: Generate Audit Report**
- [ ] **Step 3: Final Commit**
