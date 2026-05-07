import { useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '../context/AuthContext';

export const useProfileUpdate = () => {
  const { user, refreshUser } = useAuthContext();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: { name: string; phone: string | null; cpf?: string | null }) => {
    if (!user?.id) return;
    
    setIsSaving(true);
    setError(null);

    const { error: err } = await supabase.rpc('update_user_profile', {
      p_name: updates.name,
      p_phone: updates.phone ?? '',
      p_cpf: updates.cpf ?? undefined
    });

    if (err) {
      setError(err.message);
      setIsSaving(false);
      return;
    }

    // Force global session refresh
    await refreshUser();
    setIsSaving(false);
  };

  return { updateProfile, isSaving, error };
};
