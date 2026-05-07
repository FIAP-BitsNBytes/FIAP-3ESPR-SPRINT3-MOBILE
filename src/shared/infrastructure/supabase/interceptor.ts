import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Interceptor customizado para o fetch do Supabase.
 * Responsável por:
 * 1. Tratamento global de erros (Auth, RLS, Server).
 * 2. Injeção de headers de Auditoria (User ID).
 * 3. Centralização da lógica de rede.
 */

// Extrai o Project Ref dinamicamente da URL pública do Supabase
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const projectRefMatch = url.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/);
const PROJECT_REF = projectRefMatch ? projectRefMatch[1] : 'default';
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

// Cache em memória para evitar leituras constantes ao disco (AsyncStorage)
let cachedUserId: string | null = null;

/**
 * Atualiza o ID do usuário no cache do interceptor.
 * Deve ser chamado no login/logout ou mudança de sessão.
 */
export const updateInterceptorUserId = (id: string | null) => {
  cachedUserId = id;
};

export const supabaseFetch: typeof fetch = async (url, options) => {
  const resource = url.toString();
  
  // --- INTERCEPTOR DE REQUEST ---
  // Inicializa os headers de forma segura, suportando objeto literal ou instância de Headers
  const headers = new Headers(options?.headers);
  
  // Se não houver cache, tenta ler uma vez do storage (fallback)
  if (!cachedUserId && Platform.OS !== 'web') {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        cachedUserId = session?.user?.id || null;
      }
    } catch {
      // Ignora erro na leitura do storage
    }
  }

  // Injeta o ID do usuário nos headers para fins de Auditoria/Logging no Backend
  if (cachedUserId) {
    headers.set('X-User-Id', cachedUserId);
  }

  const modifiedOptions = {
    ...options,
    headers,
  };

  // Executa a chamada real
  try {
    const response = await fetch(url, modifiedOptions);

    // --- INTERCEPTOR DE RESPONSE ---
    if (!response.ok) {
      if (__DEV__) {
        try {
          const errorBody = await response.clone().json();
          console.warn(`[Supabase Error Details] ${resource}:`, errorBody);
        } catch {
          // Não é JSON, ignora
        }
      }
      handleGlobalErrors(response, resource);
    }

    return response;
  } catch (error) {
    console.error(`[Network Error] Falha crítica na requisição: ${resource}`, error);
    throw error;
  }
};

/**
 * Centraliza o tratamento de erros HTTP do Supabase.
 */
function handleGlobalErrors(response: Response, resource: string) {
  const { status } = response;

  switch (status) {
    case 401:
      console.warn(`[Auth] Sessão expirada ou inválida: ${resource}`);
      // Aqui pode-se disparar um evento global de Logout se necessário
      break;
    case 403:
      console.error(`[Security] Violação de RLS ou Permissão: ${resource}`);
      break;
    case 404:
      console.warn(`[Not Found] Recurso não encontrado: ${resource}`);
      break;
    case 429:
      console.warn(`[Rate Limit] Muitas requisições: ${resource}`);
      break;
    default:
      if (status >= 500) {
        console.error(`[Server Error] Erro interno (${status}): ${resource}`);
      }
  }
}
