import { renderHook, waitFor } from '@testing-library/react-native';
import { useGamificationRanking } from '../useGamificationRanking';
import { useAuthContext } from '@/features/auth/context/AuthContext';

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@/shared/infrastructure/supabase/client', () => {
  const channel = jest.fn(() => {
    const instance = {
      on: jest.fn(),
      subscribe: jest.fn(),
    };
    instance.on.mockImplementation(() => instance);
    instance.subscribe.mockReturnValue(instance);
    return instance;
  });

  return {
    supabase: {
      rpc: jest.fn(),
      channel,
      removeChannel: jest.fn(),
    },
  };
});

const { supabase } = jest.requireMock('@/shared/infrastructure/supabase/client') as {
  supabase: { rpc: jest.Mock; channel: jest.Mock; removeChannel: jest.Mock };
};

describe('useGamificationRanking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mapeia o resultado da RPC para RankingEntry[]', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-1' } });
    supabase.rpc.mockResolvedValue({
      data: [
        {
          patient_id: 'p1',
          patient_name: 'Paciente Um',
          level: 3,
          experience: 120,
          points: 450,
          streak_days: 7,
          clinic_rank: 1,
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useGamificationRanking(10));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ranking).toEqual([
      {
        patientId: 'p1',
        patientName: 'Paciente Um',
        level: 3,
        experience: 120,
        points: 450,
        streakDays: 7,
        clinicRank: 1,
      },
    ]);
    expect(result.current.error).toBeNull();
    expect(supabase.rpc).toHaveBeenCalledWith('get_gamification_ranking', { p_limit: 10 });
  });

  it('escopa o canal realtime por clinica quando clinicId esta disponivel', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-42' } });
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useGamificationRanking());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase.channel).toHaveBeenCalledTimes(1);
    const channelName = supabase.channel.mock.calls[0][0] as string;
    expect(channelName).toContain('ranking-clinic-42');
  });

  it('retorna erro normalizado quando a RPC falha', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-1' } });
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'Erro ao carregar ranking' } });

    const { result } = renderHook(() => useGamificationRanking());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.ranking).toEqual([]);
    expect(result.current.error).toBe('Erro ao carregar ranking');
  });

  it('usa prefixo de canal generico quando nao ha clinicId', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: null });
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useGamificationRanking());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const channelName = supabase.channel.mock.calls[0][0] as string;
    expect(channelName.startsWith('ranking-')).toBe(true);
    expect(channelName).not.toContain('ranking-clinic');
  });
});
