import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useAppPreferences, AppPreferences } from '../useAppPreferences';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const PREFERENCES_KEY = 'nutriapp_preferences';

const mockedGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;
const mockedSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('useAppPreferences', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('carrega preferencias salvas no AsyncStorage ao montar', async () => {
    const stored: AppPreferences = {
      lastEmail: 'paciente@nutriapp.com',
      notificationsEnabled: false,
    };
    mockedGetItem.mockResolvedValueOnce(JSON.stringify(stored));

    const { result } = renderHook(() => useAppPreferences());

    expect(result.current.isLoaded).toBe(false);

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.preferences).toEqual(stored);
  });

  it('nao atualiza estado quando o componente desmonta antes do load resolver', async () => {
    let resolveGet!: (value: string | null) => void;
    mockedGetItem.mockImplementationOnce(
      () =>
        new Promise<string | null>(resolve => {
          resolveGet = resolve;
        }),
    );

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const { result, unmount } = renderHook(() => useAppPreferences());
    unmount();

    resolveGet(JSON.stringify({ lastEmail: 'tarde-demais@nutriapp.com' }));
    await flushMicrotasks();

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.preferences.lastEmail).toBe('');
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('mescla os dois campos quando updatePreferences e chamado duas vezes em sequencia', async () => {
    const { result } = renderHook(() => useAppPreferences());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    // Both calls use the same callback instance (no re-render between them):
    // regression test for the stale-closure bug where the second update
    // overwrote the first.
    await act(async () => {
      await Promise.all([
        result.current.updatePreferences({ lastEmail: 'novo@nutriapp.com' }),
        result.current.updatePreferences({ notificationsEnabled: false }),
      ]);
    });

    expect(result.current.preferences).toEqual({
      lastEmail: 'novo@nutriapp.com',
      notificationsEnabled: false,
    });
  });

  it('persiste o valor mesclado no AsyncStorage ao atualizar', async () => {
    const { result } = renderHook(() => useAppPreferences());
    await waitFor(() => expect(result.current.isLoaded).toBe(true));

    await act(async () => {
      await result.current.updatePreferences({ lastEmail: 'persistido@nutriapp.com' });
    });
    await act(async () => {
      await result.current.updatePreferences({ notificationsEnabled: false });
    });

    expect(mockedSetItem).toHaveBeenLastCalledWith(
      PREFERENCES_KEY,
      JSON.stringify({
        lastEmail: 'persistido@nutriapp.com',
        notificationsEnabled: false,
      }),
    );

    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw as string)).toEqual({
      lastEmail: 'persistido@nutriapp.com',
      notificationsEnabled: false,
    });
  });
});
