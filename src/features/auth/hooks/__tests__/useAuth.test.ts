import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../useAuth';
import { supabase } from '@/shared/infrastructure/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateInterceptorUserId } from '@/shared/infrastructure/supabase/interceptor';

// Mock do Supabase
jest.mock('@/shared/infrastructure/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock do Interceptor
jest.mock('@/shared/infrastructure/supabase/interceptor', () => ({
  updateInterceptorUserId: jest.fn(),
}));

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('useAuth Stress Tests (Harden Flow)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null } });
  });

  it('deve lidar com falha critica no fetch do perfil apos login (Bug de Perfil Inexistente)', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Simula login sucesso no Auth mas falha no DB (perfil nao criado)
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ 
      data: { session: { user: { id: 'u1', email: 'test@test.com' } } } 
    });
    
    // Mock do DB retornando erro
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Profile not found' } }),
    });

    await act(async () => {
      await result.current.login('test@test.com', '123456');
    });

    // O useAuth dispara o getSession/onAuthStateChange internamente
    // Precisamos simular o disparo do evento que o useEffect ouviria
    const authChangeCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0];
    
    await act(async () => {
      await authChangeCallback('SIGNED_IN', { user: { id: 'u1', email: 'test@test.com' } });
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(AsyncStorage.removeItem).toHaveBeenCalled(); // Deve limpar se falhar
  });

  it('deve lidar com race conditions em logins multiplos rapidos (Stress)', async () => {
    const { result } = renderHook(() => useAuth());

    // Mock lento para simular atraso de rede
    (supabase.auth.signInWithPassword as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ error: null }), 50))
    );

    // Simula 5 tentativas de login simultaneas
    const attempts = [
      result.current.login('user1@test.com', 'p1'),
      result.current.login('user2@test.com', 'p2'),
      result.current.login('user3@test.com', 'p3'),
    ];

    await act(async () => {
      await Promise.allSettled(attempts);
    });
    
    // Atualmente ele dispara todas. Precisamos garantir que isso nao quebre o estado interno.
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(3);
  });

  it('deve garantir que o interceptor seja limpo no logout mesmo se a chamada de rede falhar', async () => {
    const { result } = renderHook(() => useAuth());

    (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('Network Fail'));

    try {
      await act(async () => {
        await result.current.logout();
      });
    } catch (e) {
      // Ignora erro proposital
    }

    // Mesmo com erro no signOut do Supabase, o app DEVE deslogar localmente por segurança
    expect(updateInterceptorUserId).toHaveBeenCalledWith(null);
    expect(AsyncStorage.removeItem).toHaveBeenCalled();
  });

  it('deve capturar exceções nao tratadas dentro do listener onAuthStateChange e expor estado de erro', async () => {
    const { result } = renderHook(() => useAuth());
    const authChangeCallback = (supabase.auth.onAuthStateChange as jest.Mock).mock.calls[0][0];

    // Deixa o init() inicial (getSession -> updateSession(null)) assentar normalmente
    await act(async () => {
      await Promise.resolve();
    });

    // Simula falha no fetch de perfil (RPC) dentro do listener
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Profile RPC failed' } }),
    });

    // Faz a limpeza (catch interno do updateSession) lançar tambem,
    // forcando o erro a escapar para o try/catch do listener
    (AsyncStorage.removeItem as jest.Mock).mockRejectedValueOnce(new Error('Storage unavailable'));

    // Nao deve lancar (sem unhandled rejection) e deve resolver normalmente
    await act(async () => {
      await expect(
        authChangeCallback('SIGNED_IN', { user: { id: 'u1', email: 'test@test.com' } })
      ).resolves.toBeUndefined();
    });

    expect(result.current.error).toBe('Storage unavailable');
    expect(result.current.isLoading).toBe(false);
  });
});
