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
});
