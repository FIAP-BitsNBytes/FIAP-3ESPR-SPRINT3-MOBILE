/**
 * Retorna a data local no formato YYYY-MM-DD.
 * Resolve bugs de fuso horário causados pelo toISOString() em fusos negativos.
 */
export const toDateKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Retorna a string do dia de hoje no formato YYYY-MM-DD.
 */
export const todayIso = (): string => toDateKey(new Date());
