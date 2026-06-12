import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { todayIso } from '@/shared/utils/date';
import { uniqueChannelName } from '@/shared/utils/realtime';

const REALTIME_DEBOUNCE_MS = 300;

interface DashboardStats {
  patientCount: number;
  nutritionistCount: number;
  todayAppointments: number;
  pendingNutritionists: number;
  isLoading: boolean;
  error: string | null;
}

interface DashboardCounts {
  patientCount: number;
  nutritionistCount: number;
  todayAppointments: number;
  pendingNutritionists: number;
}

const INITIAL_COUNTS: DashboardCounts = {
  patientCount: 0,
  nutritionistCount: 0,
  todayAppointments: 0,
  pendingNutritionists: 0,
};

export const useDashboardStats = (): DashboardStats => {
  const { user } = useAuthContext();
  const [counts, setCounts] = useState<DashboardCounts>(INITIAL_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async () => {
    if (!user?.clinicId) {
      setIsLoading(false);
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

    const fetchError = patients.error ?? nutritionists.error ?? todayAppts.error ?? pending.error;
    if (fetchError) {
      setIsLoading(false);
      setError(fetchError.message);
      return;
    }

    setCounts({
      patientCount: patients.count ?? 0,
      nutritionistCount: nutritionists.count ?? 0,
      todayAppointments: todayAppts.count ?? 0,
      pendingNutritionists: pending.count ?? 0,
    });
    setIsLoading(false);
    setError(null);
  };

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefetch = () => {
      if (cancelled) return;
      if (debounceTimer !== null) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (!cancelled) void fetch();
      }, REALTIME_DEBOUNCE_MS);
    };

    void fetch();

    if (user?.clinicId) {
      channel = supabase
        .channel(uniqueChannelName('admin-dashboard', user.clinicId))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, scheduleRefetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, scheduleRefetch)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'nutritionist_details' }, scheduleRefetch)
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [user?.clinicId]);

  return useMemo<DashboardStats>(
    () => ({
      ...counts,
      isLoading,
      error,
    }),
    [counts, isLoading, error],
  );
};
