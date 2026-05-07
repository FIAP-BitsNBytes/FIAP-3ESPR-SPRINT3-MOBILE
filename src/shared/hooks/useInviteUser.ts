import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';

export const useInviteUser = () => {
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUser = async (params: { email: string; name: string; role: 'NUTRITIONIST' | 'PATIENT'; crm_crn?: string }) => {
    setIsInviting(true);
    setError(null);
    try {
      const { data, error: funcErr } = await supabase.functions.invoke('invite-user', {
        body: params,
      });
      if (funcErr) throw funcErr;
      if (data?.error) throw new Error(data.error);
      return { success: true };
    } catch (err: any) {
      setError(err.message);
      return { success: false };
    } finally {
      setIsInviting(false);
    }
  };

  return { inviteUser, isInviting, error };
};
