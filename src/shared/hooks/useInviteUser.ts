import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';

type InviteUserParams = {
  email: string;
  name: string;
  role: 'NUTRITIONIST' | 'PATIENT';
  crm_crn?: string;
  redirectTo?: string;
};

type InviteUserResult =
  | { success: true; error: null }
  | { success: false; error: string };

export const useInviteUser = () => {
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUser = async (params: InviteUserParams): Promise<InviteUserResult> => {
    setIsInviting(true);
    setError(null);
    try {
      const inviteRedirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/accept-invite` : params.redirectTo;

      const { data, error: funcErr } = await supabase.functions.invoke('invite-user', {
        body: { ...params, redirectTo: inviteRedirectTo },
      });
      if (funcErr) throw funcErr;
      if (data?.error) throw new Error(data.error);
      return { success: true, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nao foi possivel enviar o convite.';
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsInviting(false);
    }
  };

  return { inviteUser, isInviting, error };
};
