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
      const { data, error: fetchErr } = await supabase
        .schema('audit')
        .from('unified_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (fetchErr) throw fetchErr;
      setLogs(data as AuditLog[]);
    } catch (err: any) {
      console.error('Audit Log Fetch Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  return { logs, isLoading, error, refresh: fetchLogs };
};
