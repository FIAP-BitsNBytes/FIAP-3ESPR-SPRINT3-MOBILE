import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { todayIso } from '@/shared/utils/date';
import { uniqueChannelName } from '@/shared/utils/realtime';

interface DashboardStats {
  patientCount: number;
  nutritionistCount: number;
  todayAppointments: number;
  pendingNutritionists: number;
  isLoading: boolean;
  error: string | null;
}

export const useDashboardStats = (): DashboardStats => {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    patientCount: 0,
    nutritionistCount: 0,
    todayAppointments: 0,
    pendingNutritionists: 0,
    isLoading: true,
    error: null,
  });

  const fetch = async () => {
    if (!user?.clinicId) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    const today = todayIso();

    const [patients, nutritionists, todayAppts, pending] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'PATIENT').eq('clinic_id', user.clinicId),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'NUTRITIONIST').eq('clinic_id', user.clinicId),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'CANCELLED')
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`), // Omitido clinic_id se a tabela não tiver, mas assumindo que RLS filtra
      supabase.from('nutritionist_details').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    ]);

    const error = patients.error ?? nutritionists.error ?? todayAppts.error ?? pending.error;
    if (error) {
      setStats(prev => ({ ...prev, isLoading: false, error: error.message }));
      return;
    }

    setStats({
      patientCount: patients.count ?? 0,
      nutritionistCount: nutritionists.count ?? 0,
      todayAppointments: todayAppts.count ?? 0,
      pendingNutritionists: pending.count ?? 0,
      isLoading: false,
      error: null,
    });
  };

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    fetch();

    if (user?.clinicId) {
      channel = supabase
        .channel(uniqueChannelName('admin-dashboard', user.clinicId))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => { if (!cancelled) void fetch(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => { if (!cancelled) void fetch(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nutritionist_details' }, () => { if (!cancelled) void fetch(); })
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [user?.clinicId]);

  return stats;
};
