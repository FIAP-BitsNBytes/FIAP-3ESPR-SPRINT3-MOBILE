import { useState, useEffect } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/shared/infrastructure/supabase/client';

export interface AuditLog {
  id: string;
  executed_at: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor_role: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The generated Database type only covers 'public'; cast to untyped client to access 'audit' schema.
      const { data, error: fetchErr } = await (supabase as unknown as SupabaseClient)
        .schema('audit')
        .from('unified_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw fetchErr;
      setLogs((data as unknown) as AuditLog[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs de auditoria');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    fetchLogs();

    channel = supabase
      .channel('audit-logs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'audit', table: 'unified_logs' },
        () => { if (!cancelled) void fetchLogs(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, []);

  return { logs, isLoading, error, refresh: fetchLogs };
};
