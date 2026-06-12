import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseFetch, updateInterceptorUserId } from '../interceptor';

// Mockando globais
global.fetch = jest.fn();
// __DEV__ é um global do React Native; Object.assign injeta no objeto global sem exigir cast.
Object.assign(global, { __DEV__: true });

// Mock do Platform (React Native)
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
}));

describe('Supabase Interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateInterceptorUserId(null); // Reseta o estado interno
  });

  it('deve preservar headers originais (como apikey) ao adicionar o X-User-Id', async () => {
    updateInterceptorUserId('user-123');
    
    const mockResponse = { ok: true, status: 200 } as Response;
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    // Simulando como o Supabase envia (muitas vezes usando a classe Headers ou objeto com apikey)
    const initialHeaders = { 'apikey': 'super-secret-key', 'Authorization': 'Bearer token' };
    
    await supabaseFetch('https://api.supabase.co', { headers: initialHeaders });

    const calledOptions = (global.fetch as jest.Mock).mock.calls[0][1];
    const headers = calledOptions.headers as Headers;

    expect(headers.get('apikey')).toBe('super-secret-key');
    expect(headers.get('Authorization')).toBe('Bearer token');
    expect(headers.get('X-User-Id')).toBe('user-123');
  });

  it('deve funcionar corretamente quando headers sao passados como instancia de Headers', async () => {
    updateInterceptorUserId('user-456');
    
    const mockResponse = { ok: true, status: 200 } as Response;
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const initialHeaders = new Headers();
    initialHeaders.append('apikey', 'key-from-instance');
    
    await supabaseFetch('https://api.supabase.co', { headers: initialHeaders });

    const calledOptions = (global.fetch as jest.Mock).mock.calls[0][1];
    const headers = calledOptions.headers as Headers;

    expect(headers.get('apikey')).toBe('key-from-instance');
    expect(headers.get('X-User-Id')).toBe('user-456');
  });

  it('deve delegar erros 403 e 500 sem quebrar a execucao', async () => {
    const mockResponse = { ok: false, status: 403, clone: () => ({ json: jest.fn().mockRejectedValue({}) }) } as unknown as Response;
    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await supabaseFetch('https://api.test/data', {});
    
    expect(response.ok).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[Security] Violação de RLS ou Permissão'));

    consoleSpy.mockRestore();
  });

  describe('Fallback de leitura do AsyncStorage', () => {
    const okResponse = { ok: true, status: 200 } as Response;

    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue(okResponse);
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    it('deve disparar apenas UMA leitura do AsyncStorage para chamadas concorrentes', async () => {
      let resolveRead!: (value: string | null) => void;
      (AsyncStorage.getItem as jest.Mock).mockReturnValue(
        new Promise<string | null>((resolve) => {
          resolveRead = resolve;
        })
      );

      // Dispara duas requisições concorrentes ANTES da leitura resolver
      const firstCall = supabaseFetch('https://api.supabase.co/a', {});
      const secondCall = supabaseFetch('https://api.supabase.co/b', {});

      resolveRead(JSON.stringify({ user: { id: 'concurrent-user' } }));
      await Promise.all([firstCall, secondCall]);

      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);

      // Ambas as requisições devem ter recebido o ID da MESMA leitura
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      expect((fetchCalls[0][1].headers as Headers).get('X-User-Id')).toBe('concurrent-user');
      expect((fetchCalls[1][1].headers as Headers).get('X-User-Id')).toBe('concurrent-user');
    });

    it('nao deve lancar erro com JSON malformado no storage e mantem userId nulo', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('{json-invalido');

      const response = await supabaseFetch('https://api.supabase.co', {});

      expect(response.ok).toBe(true);
      const calledOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect((calledOptions.headers as Headers).get('X-User-Id')).toBeNull();
    });

    it('nao deve injetar header quando o JSON e valido mas a estrutura da sessao e invalida', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ user: { id: 12345 } })
      );

      await supabaseFetch('https://api.supabase.co', {});

      const calledOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect((calledOptions.headers as Headers).get('X-User-Id')).toBeNull();
    });

    it('deve carregar o id quando a sessao persistida e valida', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ user: { id: 'stored-user-789' } })
      );

      await supabaseFetch('https://api.supabase.co', {});

      const calledOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect((calledOptions.headers as Headers).get('X-User-Id')).toBe('stored-user-789');

      // Segunda chamada deve usar o cache em memória (sem nova leitura)
      await supabaseFetch('https://api.supabase.co/cached', {});
      expect(AsyncStorage.getItem).toHaveBeenCalledTimes(1);
    });
  });
});
