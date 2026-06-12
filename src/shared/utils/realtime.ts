/**
 * Contador monotônico em nível de módulo.
 * Garante unicidade mesmo quando múltiplas chamadas ocorrem no mesmo
 * milissegundo (Date.now() idêntico) — cenário comum em montagens em rajada
 * de várias instâncias de hooks na mesma renderização.
 */
let channelCounter = 0;

/**
 * Gera um nome de canal único para inscrições do Supabase Realtime.
 * Evita colisões e vazamento de eventos entre diferentes instâncias ou re-renderizações.
 *
 * Formato: `<prefix>[-<identifier>]-<timestamp>-<counter>-<random>`
 */
export const uniqueChannelName = (prefix: string, identifier?: string): string => {
  const base = identifier ? `${prefix}-${identifier}` : prefix;
  channelCounter += 1;
  const random = Math.random().toString(36).slice(2);
  return `${base}-${Date.now()}-${channelCounter}-${random}`;
};
