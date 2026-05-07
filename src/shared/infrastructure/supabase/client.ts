import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { Database } from './database.types';
import { supabaseFetch } from './interceptor';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key são obrigatórios. Verifique o arquivo .env.');
}

// Durante SSR do Expo Web (Node.js), window não existe — protege contra ReferenceError
const webStorage: SupportedStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return Promise.resolve(null);
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return Promise.resolve();
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return Promise.resolve();
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch,
  },
  auth: {
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
