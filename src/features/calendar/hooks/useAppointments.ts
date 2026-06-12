import { supabase } from '@/shared/infrastructure/supabase/client';
import { AppointmentStatus } from '@/shared/infrastructure/supabase/database.types';
import { UserRole } from '@/features/auth/domain/auth';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';

export interface AppointmentItem {
  id: string;
  scheduledAt: string;
  status: AppointmentStatus;
  type: string | null;
  patientName?: string;
  nutritionistName?: string;
}

interface UseAppointmentsState {
  appointments: AppointmentItem[];
  isLoading: boolean;
  error: string | null;
}

/** Perfil relacionado (paciente/nutricionista) retornado pelo join. */
interface RelatedProfileRow {
  name: string;
}

/** Linha retornada pela consulta de `appointments` com joins de `profiles`. */
interface AppointmentRow {
  id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  type: string | null;
  patient: RelatedProfileRow | null;
  nutritionist: RelatedProfileRow | null;
}

const EMPTY_APPOINTMENTS: AppointmentItem[] = [];

const fetchAppointments = async (userId: string, activeRole: UserRole): Promise<AppointmentItem[]> => {
  let query = supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      status,
      type,
      patient:profiles!appointments_patient_id_fkey(name),
      nutritionist:profiles!appointments_nutritionist_id_fkey(name)
    `);

  if (activeRole === 'PATIENT') {
    query = query.eq('patient_id', userId);
  } else if (activeRole === 'NUTRITIONIST') {
    query = query.eq('nutritionist_id', userId);
  }

  const { data, error } = await query.order('scheduled_at', { ascending: true });
  if (error) throw error;

  const rows = (data ?? []) as AppointmentRow[];

  return rows.map(row => ({
    id: row.id,
    scheduledAt: row.scheduled_at,
    status: row.status,
    type: row.type,
    patientName: activeRole !== 'PATIENT' ? (row.patient?.name ?? undefined) : undefined,
    nutritionistName: activeRole !== 'NUTRITIONIST' ? (row.nutritionist?.name ?? undefined) : undefined,
  }));
};

export const useAppointments = (role?: UserRole): UseAppointmentsState => {
  const { user } = useAuthContext();
  const activeRole = role ?? user?.role;
  const userId = user?.id;

  const filter = activeRole === 'PATIENT'
    ? `patient_id=eq.${userId}`
    : `nutritionist_id=eq.${userId}`;

  const { data, isLoading, error } = useSupabaseQuery<AppointmentItem[]>({
    fetcher: () => {
      if (!userId || !activeRole) return Promise.resolve(EMPTY_APPOINTMENTS);
      return fetchAppointments(userId, activeRole);
    },
    enabled: Boolean(userId && activeRole),
    channelPrefix: `appointments-${userId ?? 'anon'}`,
    realtime: userId && activeRole
      ? [{ table: 'appointments', filter }]
      : undefined,
    deps: [activeRole, userId],
  });

  return {
    appointments: data ?? EMPTY_APPOINTMENTS,
    isLoading,
    error,
  };
};
