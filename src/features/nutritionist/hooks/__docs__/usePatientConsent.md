# usePatientConsent Hook

Manages clinic access consent for patient medical data.

## Purpose

Reads and toggles `patient_details.clinic_access_granted` — nutricionista autoriza a clínica a visualizar dados médicos privados do paciente.

## State

- `clinicAccessGranted: boolean` — current consent state
- `isLoading: boolean` — toggling in progress
- `error: string | null` — last error message

## Returns

```typescript
{
  clinicAccessGranted: boolean;
  isLoading: boolean;
  error: string | null;
  toggleConsent: () => Promise<void>;
}
```

## Dependencies

- `supabase` client
- `useSupabaseQuery` (realtime subscription to patient_details)

## Edge Cases

- Patient not found: returns `false`
- RLS prevents non-responsible nutricionista from toggling
- Toggle disabled while request in flight
