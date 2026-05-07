import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nutriapp_user_id';

/**
 * Recupera o UUID do usuário de forma rápida via AsyncStorage.
 * Utilizado para injetar o UUID explicitamente nas chamadas de API 
 * para otimização do RLS no PostgreSQL.
 */
export const getCachedUserId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
