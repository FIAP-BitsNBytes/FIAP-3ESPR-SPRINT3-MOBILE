import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { uniqueChannelName } from '@/shared/utils/realtime';

const DEFAULT_SCHEMA = 'public';
const FALLBACK_ERROR_MESSAGE = 'Erro inesperado ao carregar dados';

export interface RealtimeSpec {
  table: string;
  /** Schema do Postgres. Padrão: 'public'. */
  schema?: string;
  /** Evento monitorado. Padrão: '*'. */
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE';
  /** Filtro Realtime, ex.: 'clinic_id=eq.<uuid>'. */
  filter?: string;
}

export interface UseSupabaseQueryOptions<T> {
  /** Função de busca. Deve lançar (throw) em caso de erro. */
  fetcher: () => Promise<T>;
  /** Padrão: true. Quando false → sem fetch, sem canal, isLoading false. */
  enabled?: boolean;
  /** Prefixo passado a uniqueChannelName — nunca usado como nome literal. */
  channelPrefix: string;
  /** N tabelas monitoradas em UM ÚNICO canal. */
  realtime?: RealtimeSpec[];
  /** Se definido, eventos realtime em rajada disparam um único refetch (debounce). */
  realtimeDebounceMs?: number;
  /** Reexecuta o efeito (fetch + canal) quando esses valores mudam. */
  deps: ReadonlyArray<unknown>;
}

export interface UseSupabaseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

type SupabaseChannel = ReturnType<typeof supabase.channel>;

/**
 * Normaliza erros desconhecidos para uma mensagem legível,
 * usando apenas narrowing seguro (sem casts).
 */
const toErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string' && err.length > 0) return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const candidate = err.message;
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  return FALLBACK_ERROR_MESSAGE;
};

/**
 * Registra um listener postgres_changes no canal.
 * O switch por literal de evento é necessário porque as overloads do
 * supabase-js exigem o literal exato ('*' | 'INSERT' | ...) e não aceitam união.
 */
const attachRealtimeListener = (
  channel: SupabaseChannel,
  spec: RealtimeSpec,
  handler: () => void,
): SupabaseChannel => {
  const target = {
    schema: spec.schema ?? DEFAULT_SCHEMA,
    table: spec.table,
    ...(spec.filter !== undefined ? { filter: spec.filter } : {}),
  };

  switch (spec.event) {
    case 'INSERT':
      return channel.on('postgres_changes', { ...target, event: 'INSERT' }, handler);
    case 'UPDATE':
      return channel.on('postgres_changes', { ...target, event: 'UPDATE' }, handler);
    case 'DELETE':
      return channel.on('postgres_changes', { ...target, event: 'DELETE' }, handler);
    default:
      return channel.on('postgres_changes', { ...target, event: '*' }, handler);
  }
};

/**
 * Hook genérico de busca de dados com Supabase + Realtime.
 *
 * Substitui o padrão duplicado em 10+ hooks (useState data/isLoading/error +
 * useEffect com flag cancelled + canal realtime + cleanup) e previne
 * estruturalmente os bugs conhecidos:
 *
 * 1. Canal criado SINCRONAMENTE no início do efeito (antes do primeiro fetch
 *    resolver) — o cleanup sempre tem o handle do canal, eliminando o vazamento
 *    de "subscribe após cleanup".
 * 2. Canal removido no cleanup do efeito — cobre mudanças de deps e unmount.
 * 3. Nome do canal sempre via uniqueChannelName(channelPrefix) — nunca há
 *    colisão entre instâncias do mesmo hook.
 * 4. Múltiplas tabelas registradas em UM canal, com debounce opcional —
 *    rajadas de eventos viram um único refetch.
 *
 * Decisão documentada: em falha de REFETCH (realtime ou refresh) os dados
 * anteriores (stale) são mantidos e apenas `error` é preenchido. `data` só é
 * anulado quando a falha ocorre antes de qualquer sucesso (carga inicial).
 */
export function useSupabaseQuery<T>(options: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T> {
  const { fetcher, enabled = true, channelPrefix, realtime, realtimeDebounceMs, deps } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // Refs para fetcher/realtime: o efeito sempre usa a versão mais recente sem
  // reexecutar quando a identidade da função/array muda a cada render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const realtimeRef = useRef(realtime);
  realtimeRef.current = realtime;

  // Persiste entre execuções do efeito: distingue "falha inicial" (data → null)
  // de "falha de refetch" (mantém dados stale).
  const hasLoadedOnceRef = useRef(false);

  const refresh = useCallback(() => {
    setTick(current => current + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const runFetch = async (): Promise<void> => {
      try {
        const result = await fetcherRef.current();
        if (cancelled) return;
        hasLoadedOnceRef.current = true;
        setData(result);
        setError(null);
        setIsLoading(false);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(toErrorMessage(err));
        if (!hasLoadedOnceRef.current) {
          setData(null);
        }
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setError(null);

    // Canal criado de forma SÍNCRONA, ANTES do primeiro fetch resolver.
    // Garante que o cleanup sempre consiga removê-lo (sem leak de subscribe).
    let channel: SupabaseChannel | null = null;
    const specs = realtimeRef.current;

    if (specs && specs.length > 0) {
      const scheduleRefetch = (): void => {
        if (cancelled) return;
        if (realtimeDebounceMs !== undefined && realtimeDebounceMs > 0) {
          if (debounceTimer !== null) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
            if (!cancelled) void runFetch();
          }, realtimeDebounceMs);
          return;
        }
        void runFetch();
      };

      channel = specs.reduce<SupabaseChannel>(
        (acc, spec) => attachRealtimeListener(acc, spec, scheduleRefetch),
        supabase.channel(uniqueChannelName(channelPrefix)),
      );
      channel.subscribe();
    }

    void runFetch();

    return () => {
      cancelled = true;
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
    // deps é controlado pelo chamador; enabled/tick/channelPrefix/debounce completam a chave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, tick, channelPrefix, realtimeDebounceMs]);

  return { data, isLoading, error, refresh };
}
