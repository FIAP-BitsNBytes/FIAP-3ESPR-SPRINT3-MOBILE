import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useMealPlan } from '../useMealPlan';
import { todayIso } from '@/shared/utils/date';

interface MealPlanMetaRow { start_date: string | null; end_date: string | null; notes: string | null }

/** Builder encadeavel que resolve para `{ data, error }` via `.single()`. */
const createMealPlanBuilder = (result: { data: MealPlanMetaRow | null; error: { message: string } | null }) => {
  const builder: Record<string, jest.Mock> = {};
  ['select', 'eq'].forEach(method => {
    builder[method] = jest.fn(() => builder);
  });
  builder.single = jest.fn(() => Promise.resolve(result));
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
      rpc: jest.fn(),
      from: jest.fn(),
      channel,
      removeChannel: jest.fn(),
    },
  };
});

const { supabase } = jest.requireMock('@/shared/infrastructure/supabase/client') as {
  supabase: { rpc: jest.Mock; from: jest.Mock; channel: jest.Mock; removeChannel: jest.Mock };
};

const SUMMARY_ROW = {
  plan_id: 'plan-1',
  plan_title: 'Plano de Emagrecimento',
  item_id: 'item-1',
  meal_time: 'BREAKFAST',
  food_name: 'Aveia',
  prescribed_qty: 50,
  prescribed_unit: 'GRAMS',
  prescribed_cal: 180,
  purpose: 'Fibras',
  sequence: 0,
  log_id: null,
  actual_qty: null,
  actual_unit: null,
  actual_cal: null,
  logged_at: null,
  xp_earned: 10,
  adherence_pct: 0,
};

const MEAL_PLAN_META: MealPlanMetaRow = { start_date: '2026-06-01', end_date: '2026-07-01', notes: 'Observacoes' };

describe('useMealPlan', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna estado vazio quando patientId e null', async () => {
    const { result } = renderHook(() => useMealPlan(null));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.planId).toBeNull();
    expect(result.current.planTitle).toBeNull();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('usa todayIso() (data local) como fallback quando date nao e informado', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useMealPlan('patient-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase.rpc).toHaveBeenCalledWith('get_patient_plan_summary', {
      p_patient_id: 'patient-1',
      p_date: todayIso(),
    });
  });

  it('busca o resumo do plano e os metadados (meal_plans) quando ha itens', async () => {
    supabase.rpc.mockResolvedValue({ data: [SUMMARY_ROW], error: null });
    const mealPlansBuilder = createMealPlanBuilder({ data: MEAL_PLAN_META, error: null });
    supabase.from.mockReturnValue(mealPlansBuilder);

    const { result } = renderHook(() => useMealPlan('patient-1', '2026-06-15'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase.rpc).toHaveBeenCalledWith('get_patient_plan_summary', {
      p_patient_id: 'patient-1',
      p_date: '2026-06-15',
    });
    expect(supabase.from).toHaveBeenCalledWith('meal_plans');
    expect(mealPlansBuilder.eq).toHaveBeenCalledWith('id', 'plan-1');

    expect(result.current.planId).toBe('plan-1');
    expect(result.current.planTitle).toBe('Plano de Emagrecimento');
    expect(result.current.planStartDate).toBe('2026-06-01');
    expect(result.current.planEndDate).toBe('2026-07-01');
    expect(result.current.planNotes).toBe('Observacoes');
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]).toMatchObject({
      planId: 'plan-1',
      itemId: 'item-1',
      mealTime: 'BREAKFAST',
      foodName: 'Aveia',
      prescribedQty: 50,
      prescribedUnit: 'GRAMS',
      xpEarned: 10,
      adherencePct: 0,
    });
  });

  it('retorna plano vazio quando a RPC nao tem itens', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useMealPlan('patient-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.planId).toBeNull();
    expect(result.current.planStartDate).toBeNull();
    expect(result.current.planEndDate).toBeNull();
    expect(result.current.planNotes).toBeNull();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('registra realtime para meal_plan_items e meal_plans em um unico canal', async () => {
    supabase.rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useMealPlan('patient-1'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(supabase.channel).toHaveBeenCalledTimes(1);
    const channelName = supabase.channel.mock.calls[0][0] as string;
    expect(channelName).toContain('meal-plan-editor');

    const channelInstance = supabase.channel.mock.results[0].value as { on: jest.Mock };
    const tablesRegistered = channelInstance.on.mock.calls.map(call => (call[1] as { table: string }).table);
    expect(tablesRegistered).toEqual(['meal_plan_items', 'meal_plans']);
  });

  it('createPlan retorna sucesso e atualiza dados via refresh', async () => {
    supabase.rpc.mockImplementation((fn: string) => {
      if (fn === 'get_patient_plan_summary') return Promise.resolve({ data: [], error: null });
      if (fn === 'create_meal_plan') return Promise.resolve({ data: 'new-plan-id', error: null });
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useMealPlan('patient-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome;
    await act(async () => {
      outcome = await result.current.createPlan({ title: 'Novo Plano', startDate: '2026-06-15' });
    });

    expect(outcome).toEqual({ success: true, planId: 'new-plan-id' });
    expect(supabase.rpc).toHaveBeenCalledWith('create_meal_plan', {
      p_patient_id: 'patient-1',
      p_title: 'Novo Plano',
      p_start_date: '2026-06-15',
      p_end_date: undefined,
      p_notes: undefined,
    });
  });

  it('createPlan retorna erro quando patientId e null', async () => {
    const { result } = renderHook(() => useMealPlan(null));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome;
    await act(async () => {
      outcome = await result.current.createPlan({ title: 'X', startDate: '2026-06-15' });
    });

    expect(outcome).toEqual({ success: false, error: 'Paciente nao selecionado' });
  });

  it('upsertItem retorna erro normalizado quando a RPC falha', async () => {
    supabase.rpc.mockImplementation((fn: string) => {
      if (fn === 'get_patient_plan_summary') return Promise.resolve({ data: [], error: null });
      if (fn === 'upsert_meal_plan_item') return Promise.resolve({ data: null, error: { message: 'Erro de validacao' } });
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useMealPlan('patient-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome;
    await act(async () => {
      outcome = await result.current.upsertItem({
        planId: 'plan-1',
        mealTime: 'LUNCH',
        foodName: 'Arroz',
        qty: 100,
        unit: 'GRAMS',
      });
    });

    expect(outcome).toEqual({ success: false, error: 'Erro de validacao' });
  });

  it('deleteItem retorna sucesso quando a RPC nao retorna erro', async () => {
    supabase.rpc.mockImplementation((fn: string) => {
      if (fn === 'get_patient_plan_summary') return Promise.resolve({ data: [], error: null });
      if (fn === 'delete_meal_plan_item') return Promise.resolve({ data: true, error: null });
      return Promise.resolve({ data: null, error: null });
    });

    const { result } = renderHook(() => useMealPlan('patient-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let outcome;
    await act(async () => {
      outcome = await result.current.deleteItem('item-1');
    });

    expect(outcome).toEqual({ success: true });
    expect(supabase.rpc).toHaveBeenCalledWith('delete_meal_plan_item', { p_item_id: 'item-1' });
  });
});
