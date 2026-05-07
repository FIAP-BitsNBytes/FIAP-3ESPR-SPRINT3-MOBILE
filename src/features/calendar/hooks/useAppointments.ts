import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { AppointmentStatus } from '@/shared/infrastructure/supabase/database.types';
import { UserRole } from '@/features/auth/domain/auth';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';

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

export const useAppointments = (role: UserRole): UseAppointmentsState => {
  const [state, setState] = useState<UseAppointmentsState>({
    appointments: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      const userId = await getCachedUserId();
      if (!userId) {
        setState({ appointments: [], isLoading: false, error: null });
        return;
      }

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

      if (role === 'PATIENT') {
        query = query.eq('patient_id', userId);
      } else if (role === 'NUTRITIONIST') {
        query = query.eq('nutritionist_id', userId);
      }

      const { data, error } = await query.order('scheduled_at', { ascending: true });

      if (cancelled) return;

      if (error || !data) {
        setState({ appointments: [], isLoading: false, error: error?.message ?? 'Erro ao carregar agenda' });
        return;
      }

      const appointments: AppointmentItem[] = data.map(a => {
        const patient = a.patient as { name: string } | null;
        const nutritionist = a.nutritionist as { name: string } | null;
        return {
          id: a.id,
          scheduledAt: a.scheduled_at,
          status: a.status,
          type: a.type,
          patientName: role !== 'PATIENT' ? (patient?.name ?? undefined) : undefined,
          nutritionistName: role !== 'NUTRITIONIST' ? (nutritionist?.name ?? undefined) : undefined,
        };
      });

      setState({ appointments, isLoading: false, error: null });
    };

    fetch();
    return () => { cancelled = true; };
  }, [role]);

  return state;
};
