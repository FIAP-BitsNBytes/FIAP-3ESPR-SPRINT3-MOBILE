import { supabase } from '@/shared/infrastructure/supabase/client';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface NutritionistAppointment {
  id: string;
  patientId: string;
  patientName: string;
  scheduledAt: string;
  status: AppointmentStatus;
  type: string | null;
}

type PatientRelation = { id: string; name?: string | null } | { id: string; name?: string | null }[] | null;

type AppointmentRow = {
  id: string;
  patient_id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  type: string | null;
  patient: PatientRelation;
};

const firstPatient = (patient: PatientRelation): { id: string; name?: string | null } | null => {
  if (Array.isArray(patient)) return patient[0] ?? null;
  return patient;
};

/**
 * Lista as sessões (agendamentos) de um nutricionista para o detalhe do admin.
 * Dado operacional (agenda), não clínico — coberto pela policy
 * `admins_view_clinic_appointments`. Ordena da sessão mais recente para a mais antiga.
 */
export const useNutritionistAppointments = (nutritionistId: string) => {
  const { data, isLoading, error, refresh } = useSupabaseQuery<NutritionistAppointment[]>({
    fetcher: async () => {
      const { data: rows, error: fetchErr } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          scheduled_at,
          status,
          type,
          patient:profiles!appointments_patient_id_fkey(id, name)
        `)
        .eq('nutritionist_id', nutritionistId)
        .order('scheduled_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      return (rows ?? []).map((row: AppointmentRow) => {
        const patient = firstPatient(row.patient);
        return {
          id: row.id,
          patientId: row.patient_id,
          patientName: patient?.name ?? 'Paciente',
          scheduledAt: row.scheduled_at,
          status: row.status,
          type: row.type,
        };
      });
    },
    enabled: Boolean(nutritionistId),
    channelPrefix: `nutritionist-appointments-${nutritionistId}`,
    realtime: [{ table: 'appointments', filter: `nutritionist_id=eq.${nutritionistId}` }],
    deps: [nutritionistId],
  });

  return { appointments: data ?? [], isLoading, error, refresh };
};
