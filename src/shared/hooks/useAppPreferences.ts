import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = 'nutriapp_preferences';

export interface AppPreferences {
  lastEmail: string;
  notificationsEnabled: boolean;
}

const DEFAULT_PREFERENCES: AppPreferences = {
  lastEmail: '',
  notificationsEnabled: true,
};

export const useAppPreferences = () => {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFERENCES_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<AppPreferences>;
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch {
          // Keep defaults on parse failure
        }
      }
      setIsLoaded(true);
    });
  }, []);

  const updatePreferences = useCallback(
    async (updates: Partial<AppPreferences>) => {
      const next = { ...preferences, ...updates };
      setPreferences(next);
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
    },
    [preferences],
  );

  return { preferences, isLoaded, updatePreferences };
};
