import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';
import { parseAuditLogs, type AuditLogEntry } from '../domain/audit';

export type AuditLog = AuditLogEntry;

const AUDIT_LOGS_LIMIT = 50;

export const useAuditLogs = () => {
  const { data, isLoading, error, refresh } = useSupabaseQuery<AuditLogEntry[]>({
    fetcher: async () => {
      // O database.types.ts gerado só cobre o schema 'public'; cast para client
      // sem tipos para acessar o schema 'audit'. Ver nota em domain/audit.ts —
      // follow-up: `npx supabase gen types --schema public,audit`.
      const { data: rows, error: fetchErr } = await (supabase as unknown as SupabaseClient)
        .schema('audit')
        .from('unified_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(AUDIT_LOGS_LIMIT);

      if (fetchErr) throw fetchErr;
      return parseAuditLogs(rows);
    },
    channelPrefix: 'audit-logs',
    realtime: [{ table: 'unified_logs', schema: 'audit', event: 'INSERT' }],
    deps: [],
  });

  return { logs: data ?? [], isLoading, error, refresh };
};
