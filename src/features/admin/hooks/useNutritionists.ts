import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { getCachedUserId } from '@/shared/infrastructure/supabase/auth-cache';
import type { NutritionistRequest } from '../domain/admin';

export const useNutritionists = () => {
  const [nutritionists, setNutritionists] = useState<NutritionistRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNutritionists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = await getCachedUserId();
      if (!userId) throw new Error('Usuário não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', userId)
        .single();

      if (!profile?.clinic_id) throw new Error('Clínica não encontrada');

      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          details:nutritionist_details(crm_crn, status)
        `)
        .eq('role', 'NUTRITIONIST')
        .eq('clinic_id', profile.clinic_id);

      if (fetchErr) throw fetchErr;

      const formatted = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        crmCrn: row.details?.[0]?.crm_crn || 'N/A',
        status: row.details?.[0]?.status || 'PENDING',
      }));

      setNutritionists(formatted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionists();
  }, []);

  return { nutritionists, isLoading, error, refresh: fetchNutritionists };
};
