import { useState, useEffect, useCallback, useRef } from 'react';
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
  const prefsRef = useRef<AppPreferences>(preferences);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(PREFERENCES_KEY).then(raw => {
      if (cancelled) return;

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<AppPreferences>;
          const loaded = { ...DEFAULT_PREFERENCES, ...parsed };
          prefsRef.current = loaded;
          setPreferences(loaded);
        } catch {
          // Keep defaults on parse failure
        }
      }
      setIsLoaded(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<AppPreferences>) => {
    const next = { ...prefsRef.current, ...updates };
    prefsRef.current = next;
    setPreferences(next);
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  }, []);

  return { preferences, isLoaded, updatePreferences };
};
