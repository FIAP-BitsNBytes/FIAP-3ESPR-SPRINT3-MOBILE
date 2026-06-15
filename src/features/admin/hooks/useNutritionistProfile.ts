import { supabase } from '@/shared/infrastructure/supabase/client';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import type { NutritionistStatus } from '../domain/admin';

export interface NutritionistProfile {
  id: string;
  name: string;
  crmCrn: string;
  status: NutritionistStatus;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  memberSince: string | null;
}

type DetailRow = { crm_crn?: string | null; status?: NutritionistStatus | null };

type ProfileRow = {
  id: string;
  name: string;
  phone?: string | null;
  cpf?: string | null;
  created_at?: string | null;
  details: DetailRow | DetailRow[] | null;
};

const firstDetail = (details: DetailRow | DetailRow[] | null): DetailRow | null => {
  if (Array.isArray(details)) return details[0] ?? null;
  return details ?? null;
};

/**
 * Busca os dados pessoais/cadastrais de um nutricionista para o detalhe do admin.
 * Opera apenas com dados operacionais (não clínicos): nome, CRM/CRN, status,
 * telefone, CPF e data de cadastro.
 */
export const useNutritionistProfile = (nutritionistId: string) => {
  const { data, isLoading, error, refresh } = useSupabaseQuery<NutritionistProfile | null>({
    fetcher: async () => {
      const { data: row, error: fetchErr } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          phone,
          cpf,
          created_at,
          details:nutritionist_details(crm_crn, status)
        `)
        .eq('id', nutritionistId)
        .maybeSingle<ProfileRow>();

      if (fetchErr) throw fetchErr;
      if (!row) return null;

      const detail = firstDetail(row.details);

      // Email vive em auth.users — só acessível via RPC restrito ao admin.
      // Falha aqui não invalida o restante do detalhe (dado não-crítico).
      const { data: email } = await supabase.rpc('get_nutritionist_email', {
        p_nutritionist_id: nutritionistId,
      });

      return {
        id: row.id,
        name: row.name,
        crmCrn: detail?.crm_crn || 'N/A',
        status: detail?.status || 'PENDING',
        email: (email as string | null) ?? null,
        phone: row.phone ?? null,
        cpf: row.cpf ?? null,
        memberSince: row.created_at ?? null,
      };
    },
    enabled: Boolean(nutritionistId),
    channelPrefix: `nutritionist-profile-${nutritionistId}`,
    realtime: [
      { table: 'profiles', filter: `id=eq.${nutritionistId}` },
      { table: 'nutritionist_details', filter: `id=eq.${nutritionistId}` },
    ],
    deps: [nutritionistId],
  });

  return { profile: data ?? null, isLoading, error, refresh };
};
