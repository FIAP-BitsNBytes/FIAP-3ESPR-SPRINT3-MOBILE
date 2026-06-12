import { renderHook, act } from '@testing-library/react-native';
import { useProfileUpdate } from '../useProfileUpdate';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '../../context/AuthContext';

// Mock do Supabase
jest.mock('@/shared/infrastructure/supabase/client', () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

// Mock do contexto de autenticação
jest.mock('../../context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

describe('useProfileUpdate', () => {
  const refreshUser = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthContext as jest.Mock).mockReturnValue({
      user: { id: 'u1', name: 'Usuario Teste' },
      refreshUser,
    });
  });

  it('reporta sucesso e atualiza a sessao quando a RPC retorna sem erro e status 2xx', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null, status: 200 });

    const { result } = renderHook(() => useProfileUpdate());

    let outcome;
    await act(async () => {
      outcome = await result.current.updateProfile({ name: 'Novo Nome', phone: '11999999999', cpf: null });
    });

    expect(outcome).toEqual({ success: true });
    expect(refreshUser).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBe(null);
    expect(result.current.isSaving).toBe(false);
  });

  it('reporta falha quando a RPC retorna um erro, sem chamar refreshUser', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Falha ao atualizar perfil' },
      status: 400,
    });

    const { result } = renderHook(() => useProfileUpdate());

    let outcome;
    await act(async () => {
      outcome = await result.current.updateProfile({ name: 'Novo Nome', phone: null });
    });

    expect(outcome).toEqual({ success: false, error: 'Falha ao atualizar perfil' });
    expect(refreshUser).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Falha ao atualizar perfil');
  });

  it('reporta falha quando a RPC retorna status de erro mesmo sem objeto error', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null, status: 500 });

    const { result } = renderHook(() => useProfileUpdate());

    let outcome;
    await act(async () => {
      outcome = await result.current.updateProfile({ name: 'Novo Nome', phone: null });
    });

    expect(outcome).toEqual({ success: false, error: 'Falha ao atualizar perfil (status 500).' });
    expect(refreshUser).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Falha ao atualizar perfil (status 500).');
  });

  it('reporta falha quando a chamada RPC lanca uma excecao', async () => {
    (supabase.rpc as jest.Mock).mockRejectedValue(new Error('Network down'));

    const { result } = renderHook(() => useProfileUpdate());

    let outcome;
    await act(async () => {
      outcome = await result.current.updateProfile({ name: 'Novo Nome', phone: null });
    });

    expect(outcome).toEqual({ success: false, error: 'Network down' });
    expect(refreshUser).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Network down');
  });
});
