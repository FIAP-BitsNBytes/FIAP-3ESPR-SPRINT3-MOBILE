# ProfileScreen Technical Documentation

## Purpose
The `ProfileScreen` allows users to view and update their personal information, including name, phone number, and CPF (if not already set). It also displays the user's role, clinic association, and gamification stats (for patients).

## Mode Transitions (View vs. Edit)
To prevent accidental modifications and improve user experience, the screen operates in two modes:
1. **View Mode (Default):**
   - Fields are read-only.
   - Displays an "Editar Perfil" button.
   - Shows the "Sair da conta" option.
2. **Edit Mode:**
   - Fields (Name, Phone, and CPF if unlocked) become editable.
   - Replaces the edit button with "Salvar Alterações" and "Cancelar" buttons.
   - Validates input before saving.

## State Management
- `isEditing`: Boolean flag to toggle between modes.
- `name`, `phone`, `cpf`: Local states for form inputs, synced with global `user` context when not editing.
- `crm_crn`: Fetched from `nutritionist_details` for nutritionist users.
- `focusedField`: Used for UI highlighting during input focus.

## Dependencies
- `useAuthContext`: Provides the current user data and logout function.
- `useProfileUpdate`: Hook to handle the `update_user_profile` RPC call.
- `useGamification`: Fetches patient stats (points).
- `supabase`: Used for direct lookup of nutritionist details.

## Edge Cases
- **CPF Locking:** Once a CPF is set, it becomes non-editable for security and compliance reasons.
- **Nutritionist CRM/CRN:** This information is read-only as it is typically verified during registration or by an admin.
- **Email:** The primary identifier is non-editable.
- **Null Clinic:** If a user is not associated with a clinic, "Sem Clínica" is displayed.
