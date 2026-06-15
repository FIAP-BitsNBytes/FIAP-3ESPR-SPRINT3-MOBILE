import { supabase } from '@/shared/infrastructure/supabase/client';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';

export interface PatientProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  birthDate: string | null;
  memberSince: string | null;
}

type DetailRow = { birth_date?: string | null };

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
 * Busca os dados cadastrais básicos de um paciente para o detalhe do
 * nutricionista: nome, email, telefone, CPF, data de nascimento e cadastro.
 * Dados operacionais/de contato (não clínicos). RLS restringe profiles ao
 * nutricionista responsável; o email vem via RPC `get_patient_email`.
 */
export const usePatientProfile = (patientId: string | null) => {
  const { data, isLoading, error, refresh } = useSupabaseQuery<PatientProfile | null>({
    fetcher: async () => {
      if (!patientId) return null;

      const { data: row, error: fetchErr } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          phone,
          cpf,
          created_at,
          details:patient_details!patient_details_id_fkey(birth_date)
        `)
        .eq('id', patientId)
        .maybeSingle<ProfileRow>();

      if (fetchErr) throw fetchErr;
      if (!row) return null;

      const detail = firstDetail(row.details);

      // Email vive em auth.users — só acessível via RPC restrito.
      // Falha aqui não invalida o restante do detalhe (dado não-crítico).
      const { data: email } = await supabase.rpc('get_patient_email', {
        p_patient_id: patientId,
      });

      return {
        id: row.id,
        name: row.name,
        email: (email as string | null) ?? null,
        phone: row.phone ?? null,
        cpf: row.cpf ?? null,
        birthDate: detail?.birth_date ?? null,
        memberSince: row.created_at ?? null,
      };
    },
    enabled: Boolean(patientId),
    channelPrefix: `patient-profile-${patientId ?? 'none'}`,
    realtime: patientId
      ? [
          { table: 'profiles', filter: `id=eq.${patientId}` },
          { table: 'patient_details', filter: `id=eq.${patientId}` },
        ]
      : undefined,
    deps: [patientId],
  });

  return { profile: data ?? null, isLoading, error, refresh };
};
