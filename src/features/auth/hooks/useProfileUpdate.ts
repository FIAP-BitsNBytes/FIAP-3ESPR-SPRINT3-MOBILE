import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '../context/AuthContext';

export interface ProfileUpdateInput {
  name: string;
  phone: string | null;
  cpf?: string | null;
}

export type ProfileUpdateResult =
  | { success: true }
  | { success: false; error: string };

const RPC_ERROR_STATUS_THRESHOLD = 400;

const isFailureStatus = (status: number | undefined): boolean =>
  typeof status === 'number' && status >= RPC_ERROR_STATUS_THRESHOLD;

export const useProfileUpdate = () => {
  const { user, refreshUser } = useAuthContext();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: ProfileUpdateInput): Promise<ProfileUpdateResult> => {
    if (!user?.id) {
      const message = 'Usuário não autenticado.';
      setError(message);
      return { success: false, error: message };
    }

    setIsSaving(true);
    setError(null);

    try {
      const { error: rpcError, status } = await supabase.rpc('update_user_profile', {
        p_name: updates.name,
        p_phone: updates.phone ?? '',
        p_cpf: updates.cpf ?? undefined
      });

      if (rpcError || isFailureStatus(status)) {
        const message = rpcError?.message ?? `Falha ao atualizar perfil (status ${status}).`;
        setError(message);
        return { success: false, error: message };
      }

      // Force global session refresh
      await refreshUser();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha inesperada ao atualizar perfil.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsSaving(false);
    }
  };

  return { updateProfile, isSaving, error };
};
