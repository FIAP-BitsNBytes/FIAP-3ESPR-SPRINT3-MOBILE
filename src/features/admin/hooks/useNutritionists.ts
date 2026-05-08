import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { uniqueChannelName } from '@/shared/utils/realtime';
import type { NutritionistRequest } from '../domain/admin';

type NutritionistDetailsRow = {
  crm_crn?: string | null;
  status?: NutritionistRequest['status'] | null;
};

type ProfileRow = {
  id: string;
  name: string;
  details: NutritionistDetailsRow | NutritionistDetailsRow[] | null;
};

const firstDetail = (details: NutritionistDetailsRow | NutritionistDetailsRow[] | null): NutritionistDetailsRow | null => {
  if (Array.isArray(details)) return details[0] ?? null;
  return details ?? null;
};

export const useNutritionists = () => {
  const { user } = useAuthContext();
  const [nutritionists, setNutritionists] = useState<NutritionistRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNutritionists = async () => {
    if (!user?.clinicId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          details:nutritionist_details(crm_crn, status)
        `)
        .eq('role', 'NUTRITIONIST')
        .eq('clinic_id', user.clinicId);

      if (fetchErr) throw fetchErr;

      const formatted = (data || []).map((row: ProfileRow) => {
        const detail = firstDetail(row.details);

        return {
          id: row.id,
          name: row.name,
          crmCrn: detail?.crm_crn || 'N/A',
          status: detail?.status || 'PENDING',
        };
      });

      setNutritionists(formatted);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar nutricionistas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let channelProfiles: ReturnType<typeof supabase.channel> | null = null;
    let channelDetails: ReturnType<typeof supabase.channel> | null = null;

    fetchNutritionists();

    if (user?.clinicId) {
      // Monitora novos nutricionistas na clínica
      channelProfiles = supabase
        .channel(uniqueChannelName('admin-nutritionists-profiles', user.clinicId))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `clinic_id=eq.${user.clinicId}` },
          () => { if (!cancelled) void fetchNutritionists(); }
        )
        .subscribe();

      // Monitora mudanças de status/CRM nos detalhes (aprovações)
      channelDetails = supabase
        .channel(uniqueChannelName('admin-nutritionists-details', user.clinicId))
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'nutritionist_details' },
          () => { if (!cancelled) void fetchNutritionists(); }
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channelProfiles) void supabase.removeChannel(channelProfiles);
      if (channelDetails) void supabase.removeChannel(channelDetails);
    };
  }, [user?.clinicId]);

  return { nutritionists, isLoading, error, refresh: fetchNutritionists };
};
