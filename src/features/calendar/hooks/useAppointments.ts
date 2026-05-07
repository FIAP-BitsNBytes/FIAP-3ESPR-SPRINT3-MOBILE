import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { AppointmentStatus } from '@/shared/infrastructure/supabase/database.types';
import { UserRole } from '@/features/auth/domain/auth';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { uniqueChannelName } from '@/shared/utils/realtime';

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

export const useAppointments = (role?: UserRole): UseAppointmentsState => {
  const { user } = useAuthContext();
  const activeRole = role ?? user?.role;
  const [state, setState] = useState<UseAppointmentsState>({
    appointments: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetch = async () => {
      if (!user?.id || !activeRole) {
        if (!cancelled) setState({ appointments: [], isLoading: false, error: null });
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

      if (activeRole === 'PATIENT') {
        query = query.eq('patient_id', user.id);
      } else if (activeRole === 'NUTRITIONIST') {
        query = query.eq('nutritionist_id', user.id);
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
          patientName: activeRole !== 'PATIENT' ? (patient?.name ?? undefined) : undefined,
          nutritionistName: activeRole !== 'NUTRITIONIST' ? (nutritionist?.name ?? undefined) : undefined,
        };
      });

      setState({ appointments, isLoading: false, error: null });
    };

    fetch();

    if (user?.id && activeRole) {
      const filter = activeRole === 'PATIENT' 
        ? `patient_id=eq.${user.id}` 
        : `nutritionist_id=eq.${user.id}`;

      channel = supabase
        .channel(uniqueChannelName('appointments', user.id))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'appointments', filter },
          () => { void fetch(); }
        )
        .subscribe();
    }

    return () => { 
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [activeRole, user?.id]);

  return state;
};
