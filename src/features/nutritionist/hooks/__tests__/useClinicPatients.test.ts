import { renderHook, waitFor } from '@testing-library/react-native';
import { useClinicPatients } from '../useClinicPatients';
import { useAuthContext } from '@/features/auth/context/AuthContext';

jest.mock('@/features/auth/context/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

interface ProfilesRow { id: string; name: string }
interface StatsRow { patient_id: string; level: number; streak_days: number; points: number; experience: number }

/** Builder encadeavel que resolve para `{ data, error }` ao ser usado como Promise. */
const createQueryBuilder = <T,>(result: { data: T | null; error: { message: string } | null }) => {
  const builder: Record<string, jest.Mock> = {};
  const chainMethods = ['select', 'eq', 'order', 'in'];
  chainMethods.forEach(method => {
    builder[method] = jest.fn(() => builder);
  });
  builder.then = jest.fn((onFulfilled: (value: typeof result) => unknown) => Promise.resolve(onFulfilled(result)));
  return builder;
};

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
      from: jest.fn(),
      channel,
      removeChannel: jest.fn(),
    },
  };
});

const { supabase } = jest.requireMock('@/shared/infrastructure/supabase/client') as {
  supabase: { from: jest.Mock; channel: jest.Mock; removeChannel: jest.Mock };
};

describe('useClinicPatients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna lista vazia quando o usuario nao possui clinicId', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: null } });

    const { result } = renderHook(() => useClinicPatients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.patients).toEqual([]);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.lowEngagement).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('busca perfis e stats em UMA unica query batched (.in) sem N+1', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-1' } });

    const profilesRows: ProfilesRow[] = [
      { id: 'p1', name: 'Ana' },
      { id: 'p2', name: 'Bruno' },
    ];
    const statsRows: StatsRow[] = [
      { patient_id: 'p1', level: 5, streak_days: 10, points: 500, experience: 1200 },
      { patient_id: 'p2', level: 1, streak_days: 0, points: 20, experience: 10 },
    ];

    const profilesBuilder = createQueryBuilder<ProfilesRow[]>({ data: profilesRows, error: null });
    const statsBuilder = createQueryBuilder<StatsRow[]>({ data: statsRows, error: null });

    supabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder;
      if (table === 'gamification_stats') return statsBuilder;
      throw new Error(`unexpected table ${table}`);
    });

    const { result } = renderHook(() => useClinicPatients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Exatamente UMA chamada por tabela => sem N+1 (uma query por linha de paciente)
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.from).toHaveBeenCalledWith('gamification_stats');
    expect(supabase.from).toHaveBeenCalledTimes(2);
    expect(statsBuilder.in).toHaveBeenCalledWith('patient_id', ['p1', 'p2']);

    expect(result.current.patients).toEqual([
      { id: 'p1', name: 'Ana', level: 5, streakDays: 10, points: 500, experience: 1200 },
      { id: 'p2', name: 'Bruno', level: 1, streakDays: 0, points: 20, experience: 10 },
    ]);
    expect(result.current.totalCount).toBe(2);
  });

  it('aplica valores padrao quando o paciente nao possui linha em gamification_stats', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-1' } });

    const profilesBuilder = createQueryBuilder<ProfilesRow[]>({
      data: [{ id: 'p1', name: 'Ana' }],
      error: null,
    });
    const statsBuilder = createQueryBuilder<StatsRow[]>({ data: [], error: null });

    supabase.from.mockImplementation((table: string) => {
      if (table === 'profiles') return profilesBuilder;
      return statsBuilder;
    });

    const { result } = renderHook(() => useClinicPatients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.patients).toEqual([
      { id: 'p1', name: 'Ana', level: 1, streakDays: 0, points: 0, experience: 0 },
    ]);
  });

  it('calcula lowEngagement com base em streak/points e limita a 5', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-1' } });

    const profilesRows: ProfilesRow[] = Array.from({ length: 6 }, (_, i) => ({ id: `p${i}`, name: `Paciente ${i}` }));
    const statsRows: StatsRow[] = profilesRows.map((p, i) => ({
      patient_id: p.id,
      level: 1,
      streak_days: 1, // todos com baixo engajamento (<= 2)
      points: 10 + i,
      experience: 0,
    }));

    const profilesBuilder = createQueryBuilder<ProfilesRow[]>({ data: profilesRows, error: null });
    const statsBuilder = createQueryBuilder<StatsRow[]>({ data: statsRows, error: null });

    supabase.from.mockImplementation((table: string) => (table === 'profiles' ? profilesBuilder : statsBuilder));

    const { result } = renderHook(() => useClinicPatients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.patients).toHaveLength(6);
    expect(result.current.lowEngagement).toHaveLength(5);
  });

  it('propaga erro quando a query de perfis falha', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-1' } });

    const profilesBuilder = createQueryBuilder<ProfilesRow[]>({ data: null, error: { message: 'Erro ao carregar pacientes' } });
    supabase.from.mockReturnValue(profilesBuilder);

    const { result } = renderHook(() => useClinicPatients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Erro ao carregar pacientes');
  });

  it('cria canal realtime escopado pela clinica', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({ user: { clinicId: 'clinic-99' } });

    const profilesBuilder = createQueryBuilder<ProfilesRow[]>({ data: [], error: null });
    const statsBuilder = createQueryBuilder<StatsRow[]>({ data: [], error: null });
    supabase.from.mockImplementation((table: string) => (table === 'profiles' ? profilesBuilder : statsBuilder));

    const { result } = renderHook(() => useClinicPatients());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase.channel).toHaveBeenCalledTimes(1);
    const channelName = supabase.channel.mock.calls[0][0] as string;
    expect(channelName).toContain('clinic-patients-clinic-99');
  });
});
