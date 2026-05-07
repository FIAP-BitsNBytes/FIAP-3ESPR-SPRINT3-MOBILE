/**
 * Gera um nome de canal único para inscrições do Supabase Realtime.
 * Evita colisões e vazamento de eventos entre diferentes instâncias ou re-renderizações.
 */
export const uniqueChannelName = (prefix: string, identifier?: string): string => {
  const base = identifier ? `${prefix}-${identifier}` : prefix;
  return `${base}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
