import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSupabaseQuery } from '../useSupabaseQuery';

type RealtimeHandler = () => void;

interface ChannelMock {
  name: string;
  handlers: RealtimeHandler[];
  on: jest.Mock;
  subscribe: jest.Mock;
}

interface SupabaseMockModule {
  supabase: {
    channel: jest.Mock;
    removeChannel: jest.Mock;
  };
  __channels: ChannelMock[];
}

jest.mock('@/shared/infrastructure/supabase/client', () => {
  const channels: Array<{
    name: string;
    handlers: Array<() => void>;
    on: jest.Mock;
    subscribe: jest.Mock;
  }> = [];

  const channel = jest.fn((name: string) => {
    const instance = {
      name,
      handlers: [] as Array<() => void>,
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    instance.on.mockImplementation((_type: string, _filter: unknown, handler: () => void) => {
      instance.handlers.push(handler);
      return instance;
    });
    instance.subscribe.mockReturnValue(instance);
    channels.push(instance);
    return instance;
  });

  return {
    supabase: {
      channel,
      removeChannel: jest.fn(),
    },
    __channels: channels,
  };
});

const supabaseMockModule = jest.requireMock('@/shared/infrastructure/supabase/client') as SupabaseMockModule;
const { supabase: supabaseMock, __channels: channelMocks } = supabaseMockModule;

const createDeferred = <T,>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (err: unknown) => void } => {
  let resolve: (value: T) => void = () => undefined;
  let reject: (err: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('useSupabaseQuery', () => {
  beforeEach(() => {
    channelMocks.length = 0;
    supabaseMock.channel.mockClear();
    supabaseMock.removeChannel.mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetch básico', () => {
    it('carrega dados com sucesso e finaliza isLoading', async () => {
      const fetcher = jest.fn().mockResolvedValue(['item-1', 'item-2']);

      const { result } = renderHook(() =>
        useSupabaseQuery<string[]>({ fetcher, channelPrefix: 'test', deps: [] }),
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeNull();

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.data).toEqual(['item-1', 'item-2']);
      expect(result.current.error).toBeNull();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('normaliza Error lançado pelo fetcher em mensagem string', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('Falha de rede'));

      const { result } = renderHook(() =>
        useSupabaseQuery<string[]>({ fetcher, channelPrefix: 'test', deps: [] }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).toBe('Falha de rede');
      expect(result.current.data).toBeNull();
    });

    it('normaliza erro objeto com campo message (estilo PostgrestError)', async () => {
      const fetcher = jest.fn().mockRejectedValue({ message: 'permission denied', code: '42501' });

      const { result } = renderHook(() =>
        useSupabaseQuery<number>({ fetcher, channelPrefix: 'test', deps: [] }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('permission denied');
    });

    it('usa mensagem fallback para erro nao reconhecivel', async () => {
      const fetcher = jest.fn().mockRejectedValue(42);

      const { result } = renderHook(() =>
        useSupabaseQuery<number>({ fetcher, channelPrefix: 'test', deps: [] }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.error).toBe('Erro inesperado ao carregar dados');
    });
  });

  describe('enabled: false', () => {
    it('nao executa fetch, nao cria canal e isLoading fica false', () => {
      const fetcher = jest.fn().mockResolvedValue('never');

      const { result } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          enabled: false,
          channelPrefix: 'disabled',
          realtime: [{ table: 'meal_logs' }],
          deps: [],
        }),
      );

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(fetcher).not.toHaveBeenCalled();
      expect(supabaseMock.channel).not.toHaveBeenCalled();
    });
  });

  describe('cancelamento (unmount durante fetch)', () => {
    it('nao atualiza estado quando o fetch resolve apos unmount', async () => {
      const deferred = createDeferred<string>();
      const fetcher = jest.fn(() => deferred.promise);

      const { result, unmount } = renderHook(() =>
        useSupabaseQuery<string>({ fetcher, channelPrefix: 'race', deps: [] }),
      );

      expect(result.current.isLoading).toBe(true);
      unmount();

      await act(async () => {
        deferred.resolve('chegou tarde');
        await deferred.promise;
      });

      // O snapshot final permanece o do momento do unmount — nenhum setState ocorreu.
      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(true);
    });

    it('remove o canal no unmount mesmo com fetch ainda pendente', () => {
      const deferred = createDeferred<string>();
      const fetcher = jest.fn(() => deferred.promise);

      const { unmount } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          channelPrefix: 'leak',
          realtime: [{ table: 'meal_logs' }],
          deps: [],
        }),
      );

      // Canal criado SINCRONAMENTE, antes do fetch resolver.
      expect(supabaseMock.channel).toHaveBeenCalledTimes(1);
      expect(channelMocks[0].subscribe).toHaveBeenCalledTimes(1);

      unmount();

      expect(supabaseMock.removeChannel).toHaveBeenCalledTimes(1);
      expect(supabaseMock.removeChannel).toHaveBeenCalledWith(channelMocks[0]);
    });
  });

  describe('realtime', () => {
    it('registra N tabelas em UM unico canal', async () => {
      const fetcher = jest.fn().mockResolvedValue('ok');

      const { result } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          channelPrefix: 'multi',
          realtime: [
            { table: 'profiles' },
            { table: 'appointments', event: 'INSERT' },
            { table: 'gamification_stats', filter: 'clinic_id=eq.abc', schema: 'public' },
          ],
          deps: [],
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(supabaseMock.channel).toHaveBeenCalledTimes(1);
      expect(channelMocks[0].on).toHaveBeenCalledTimes(3);
      expect(channelMocks[0].subscribe).toHaveBeenCalledTimes(1);

      expect(channelMocks[0].on).toHaveBeenNthCalledWith(
        1,
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        expect.any(Function),
      );
      expect(channelMocks[0].on).toHaveBeenNthCalledWith(
        2,
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'appointments' },
        expect.any(Function),
      );
      expect(channelMocks[0].on).toHaveBeenNthCalledWith(
        3,
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gamification_stats', filter: 'clinic_id=eq.abc' },
        expect.any(Function),
      );
    });

    it('gera nomes de canal unicos para duas instancias com o mesmo prefixo', async () => {
      const fetcher = jest.fn().mockResolvedValue('ok');
      const options = {
        fetcher,
        channelPrefix: 'same-prefix',
        realtime: [{ table: 'profiles' }],
        deps: [] as ReadonlyArray<unknown>,
      };

      const first = renderHook(() => useSupabaseQuery<string>(options));
      const second = renderHook(() => useSupabaseQuery<string>(options));

      await waitFor(() => expect(first.result.current.isLoading).toBe(false));
      await waitFor(() => expect(second.result.current.isLoading).toBe(false));

      expect(channelMocks).toHaveLength(2);
      expect(channelMocks[0].name).not.toBe(channelMocks[1].name);
      expect(channelMocks[0].name).toMatch(/^same-prefix-/);
      expect(channelMocks[1].name).toMatch(/^same-prefix-/);
    });

    it('evento realtime sem debounce dispara refetch imediato', async () => {
      const fetcher = jest.fn().mockResolvedValue('v1');

      const { result } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          channelPrefix: 'rt',
          realtime: [{ table: 'meal_logs' }],
          deps: [],
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(fetcher).toHaveBeenCalledTimes(1);

      fetcher.mockResolvedValue('v2');
      await act(async () => {
        channelMocks[0].handlers[0]();
      });

      await waitFor(() => expect(result.current.data).toBe('v2'));
      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('mantem dados stale e seta error quando o REFETCH falha', async () => {
      const fetcher = jest
        .fn()
        .mockResolvedValueOnce('dados-validos')
        .mockRejectedValueOnce(new Error('refetch falhou'));

      const { result } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          channelPrefix: 'stale',
          realtime: [{ table: 'meal_logs' }],
          deps: [],
        }),
      );

      await waitFor(() => expect(result.current.data).toBe('dados-validos'));

      await act(async () => {
        channelMocks[0].handlers[0]();
      });

      await waitFor(() => expect(result.current.error).toBe('refetch falhou'));
      // Decisao documentada: falha de refetch preserva os dados anteriores.
      expect(result.current.data).toBe('dados-validos');
    });
  });

  describe('debounce de eventos realtime', () => {
    it('rajada de eventos gera UM unico refetch apos o debounce', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn().mockResolvedValue('ok');

      const { result } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          channelPrefix: 'burst',
          realtime: [{ table: 'profiles' }, { table: 'appointments' }],
          realtimeDebounceMs: 250,
          deps: [],
        }),
      );

      // Conclui o fetch inicial.
      await act(async () => {
        await Promise.resolve();
      });
      expect(result.current.isLoading).toBe(false);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Rajada: varias tabelas mudando ao mesmo tempo.
      act(() => {
        channelMocks[0].handlers[0]();
        channelMocks[0].handlers[1]();
        channelMocks[0].handlers[0]();
        channelMocks[0].handlers[1]();
      });

      // Antes do timer estourar, nenhum refetch.
      expect(fetcher).toHaveBeenCalledTimes(1);

      await act(async () => {
        jest.advanceTimersByTime(250);
        await Promise.resolve();
      });

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('limpa o timer de debounce no cleanup (sem refetch apos unmount)', async () => {
      jest.useFakeTimers();
      const fetcher = jest.fn().mockResolvedValue('ok');

      const { unmount } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          channelPrefix: 'cleanup',
          realtime: [{ table: 'profiles' }],
          realtimeDebounceMs: 200,
          deps: [],
        }),
      );

      await act(async () => {
        await Promise.resolve();
      });
      expect(fetcher).toHaveBeenCalledTimes(1);

      act(() => {
        channelMocks[0].handlers[0]();
      });

      unmount();

      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      // Timer cancelado no cleanup — nenhum refetch fantasma.
      expect(fetcher).toHaveBeenCalledTimes(1);
    });
  });

  describe('refresh e deps', () => {
    it('refresh() reexecuta o fetch e recria o canal', async () => {
      const fetcher = jest.fn().mockResolvedValue('v1');

      const { result } = renderHook(() =>
        useSupabaseQuery<string>({
          fetcher,
          channelPrefix: 'refresh',
          realtime: [{ table: 'profiles' }],
          deps: [],
        }),
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(fetcher).toHaveBeenCalledTimes(1);

      fetcher.mockResolvedValue('v2');
      act(() => {
        result.current.refresh();
      });

      await waitFor(() => expect(result.current.data).toBe('v2'));
      expect(fetcher).toHaveBeenCalledTimes(2);
      // Canal antigo removido e novo criado pelo re-run do efeito.
      expect(supabaseMock.removeChannel).toHaveBeenCalledTimes(1);
      expect(supabaseMock.channel).toHaveBeenCalledTimes(2);
    });

    it('mudanca de deps remove o canal antigo e cria um novo', async () => {
      const fetcher = jest.fn().mockResolvedValue('ok');

      const { result, rerender } = renderHook(
        ({ patientId }: { patientId: string }) =>
          useSupabaseQuery<string>({
            fetcher,
            channelPrefix: 'deps',
            realtime: [{ table: 'meal_logs', filter: `patient_id=eq.${patientId}` }],
            deps: [patientId],
          }),
        { initialProps: { patientId: 'p1' } },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(supabaseMock.channel).toHaveBeenCalledTimes(1);

      rerender({ patientId: 'p2' });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(supabaseMock.removeChannel).toHaveBeenCalledTimes(1);
      expect(supabaseMock.removeChannel).toHaveBeenCalledWith(channelMocks[0]);
      expect(supabaseMock.channel).toHaveBeenCalledTimes(2);
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });
});
