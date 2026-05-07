import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';

interface DashboardStats {
  patientCount: number;
  nutritionistCount: number;
  todayAppointments: number;
  pendingNutritionists: number;
  isLoading: boolean;
  error: string | null;
}

const todayIso = () => new Date().toISOString().split('T')[0];

export const useDashboardStats = (): DashboardStats => {
  const [stats, setStats] = useState<DashboardStats>({
    patientCount: 0,
    nutritionistCount: 0,
    todayAppointments: 0,
    pendingNutritionists: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      const today = todayIso();

      const [patients, nutritionists, todayAppts, pending] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'PATIENT'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'NUTRITIONIST'),
        supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .gte('scheduled_at', `${today}T00:00:00`)
          .lte('scheduled_at', `${today}T23:59:59`),
        supabase.from('nutritionist_details').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      ]);

      if (cancelled) return;

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

    fetch();
    return () => { cancelled = true; };
  }, []);

  return stats;
};
