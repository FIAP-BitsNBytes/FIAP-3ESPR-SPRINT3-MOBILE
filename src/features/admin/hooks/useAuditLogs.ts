import { useState, useEffect } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';

export interface AuditLog {
  id: string;
  executed_at: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor_role: string;
  old_data: any;
  new_data: any;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Note: unified_logs is in 'audit' schema, so we access it via the specific table name
      // If the client is configured only for 'public', we might need a RPC or raw query,
      // but usually Supabase client can access other schemas if permissions allow.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchErr } = await (supabase as any)
        .schema('audit')
        .from('unified_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw fetchErr;
      setLogs((data as unknown) as AuditLog[]);
    } catch (err: any) {
      console.error('Audit Log Fetch Error:', err);
      setError(err.message);
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
