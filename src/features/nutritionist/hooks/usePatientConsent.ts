import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';

interface PatientConsent {
  clinicAccessGranted: boolean;
  isLoading: boolean;
  error: string | null;
  toggleConsent: () => Promise<void>;
}

export const usePatientConsent = (patientId: string | null): PatientConsent => {
  const [isTogglingLoading, setIsTogglingLoading] = useState(false);

  const { data: consentData, isLoading, error, refresh } = useSupabaseQuery<{
    clinic_access_granted: boolean;
  } | null>({
    fetcher: async () => {
      if (!patientId) return null;

      const { data, error: fetchErr } = await supabase
        .from('patient_details')
        .select('*')
        .eq('id', patientId)
        .single();

      if (fetchErr) throw fetchErr;

      // Handle both old schema (no clinic_access_granted) and new schema
      return {
        clinic_access_granted: (data as Record<string, unknown>)?.clinic_access_granted === true,
      };
    },
    enabled: Boolean(patientId),
    channelPrefix: `patient-consent-${patientId}`,
    realtime: [{ table: 'patient_details', filter: `id=eq.${patientId}` }],
    deps: [patientId],
  });

  const toggleConsent = async () => {
    if (!patientId || isTogglingLoading) return;

    setIsTogglingLoading(true);
    try {
      const currentValue = consentData?.clinic_access_granted ?? false;
      const updatePayload = { clinic_access_granted: !currentValue };
      const { error: updateErr } = await supabase
        .from('patient_details')
        .update(updatePayload)
        .eq('id', patientId);

      if (updateErr) throw updateErr;
      await refresh();
    } catch (err: unknown) {
      // Silently fail if column doesn't exist yet (migration not applied)
      if (err instanceof Error) {
        console.debug('clinic_access_granted update failed', err.message);
      }
    } finally {
      setIsTogglingLoading(false);
    }
  };

  const getErrorMessage = (): string | null => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
      const msg = (error as Record<string, unknown>).message;
      if (typeof msg === 'string') return msg;
    }
    return null;
  };

  return {
    clinicAccessGranted: consentData?.clinic_access_granted ?? false,
    isLoading: isLoading || isTogglingLoading,
    error: getErrorMessage(),
    toggleConsent,
  };
};
