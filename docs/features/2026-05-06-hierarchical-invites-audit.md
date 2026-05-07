# Feature Audit Report: Hierarchical Invites

## 1. Overview
The Hierarchical Invites feature allows secure onboarding of new users while maintaining strict clinic and nutritionist-patient links. 

## 2. Architecture
- **Trigger**: User interacts with FAB in Nutritionists (Admin) or Patients (Nutritionist) screen.
- **Process**: 
    1. Hook `useInviteUser` calls Edge Function `invite-user`.
    2. Edge Function validates caller permissions and hierarchy.
    3. Edge Function uses `admin` privileges to create Auth user and DB records.
- **Data Flow**: `UI -> useInviteUser -> Edge Function -> Supabase Auth & DB`.

## 3. RLS Verification
- **Profiles**: Restricted by `clinic_id` (enforced in `profiles visible within same clinic`).
- **Nutritionist Details**: Admins only manage nutritionists in their own clinic (fixed in `20260506235901_fix_nutritionist_management_rls.sql`).
- **Patient Details**: Nutritionists only manage patients linked to them in their clinic.

## 4. Requirements Mapping
- [x] Admin can invite Nutritionist.
- [x] Nutritionist can invite Patient.
- [x] Patients cannot invite anyone.
- [x] Users are automatically linked to the inviter's clinic.
- [x] Patients are automatically linked to the inviting nutritionist.
- [x] Security: Edge function validates hierarchy and uses `service_role`.

## 5. Testing Evidence
- Edge function returns `400` if hierarchy is violated (e.g. Nutri trying to invite Nutri).
- Auth invitation email is sent correctly.
- Database records in `profiles` and `details` tables are created with correct UUIDs and Foreign Keys.
