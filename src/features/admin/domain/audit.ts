/**
 * Domínio de Auditoria — parsing seguro de linhas do schema `audit.unified_logs`.
 *
 * NOTA SOBRE O `as unknown` (documentado e único permitido no codebase):
 * O `database.types.ts` gerado atualmente só cobre o schema `public`. O
 * schema `audit` ainda não foi incluído na geração de tipos, então o
 * `SupabaseClient` tipado não conhece `.schema('audit')`. Até que o
 * follow-up `npx supabase gen types --schema public,audit` seja executado
 * e os tipos gerados sejam atualizados, o client precisa ser tratado como
 * `unknown` para acessar o schema `audit`. Esse cast vive isolado em
 * `useAuditLogs.ts` (acesso ao client) — este arquivo é o único lugar
 * autorizado a fazer o cast do **resultado** (`unknown` → `AuditLogEntry`),
 * via `parseAuditLog`, que aplica narrowing em runtime campo a campo.
 */

export interface AuditLogEntry {
  id: string;
  executed_at: string;
  table_name: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  actor_role: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
}

const VALID_ACTIONS: ReadonlySet<string> = new Set(['INSERT', 'UPDATE', 'DELETE']);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0;

const isAuditAction = (value: unknown): value is AuditLogEntry['action'] =>
  typeof value === 'string' && VALID_ACTIONS.has(value);

const isJsonDataOrNull = (value: unknown): value is Record<string, unknown> | null =>
  value === null || isPlainObject(value);

/**
 * Faz o parsing/narrowing em runtime de uma linha vinda de `audit.unified_logs`.
 *
 * Decisão documentada: lança `Error` quando a linha não corresponde ao shape
 * esperado de `AuditLogEntry`. Racional: uma linha de auditoria malformada
 * indica um problema de schema/migração — preferimos falhar alto (e o chamador
 * decide o que fazer com o erro, ex.: exibir mensagem e manter dados stale)
 * em vez de devolver silenciosamente `null` e mascarar a inconsistência.
 */
export const parseAuditLog = (row: unknown): AuditLogEntry => {
  if (!isPlainObject(row)) {
    throw new Error('Registro de auditoria inválido: esperado um objeto');
  }

  const { id, executed_at, table_name, action, actor_role, old_data, new_data } = row;

  if (!isNonEmptyString(id)) {
    throw new Error('Registro de auditoria inválido: campo "id" ausente ou não é string');
  }
  if (!isNonEmptyString(executed_at)) {
    throw new Error('Registro de auditoria inválido: campo "executed_at" ausente ou não é string');
  }
  if (!isNonEmptyString(table_name)) {
    throw new Error('Registro de auditoria inválido: campo "table_name" ausente ou não é string');
  }
  if (!isAuditAction(action)) {
    throw new Error('Registro de auditoria inválido: campo "action" ausente ou com valor inesperado');
  }
  if (!isNonEmptyString(actor_role)) {
    throw new Error('Registro de auditoria inválido: campo "actor_role" ausente ou não é string');
  }
  if (!isJsonDataOrNull(old_data)) {
    throw new Error('Registro de auditoria inválido: campo "old_data" deve ser objeto ou null');
  }
  if (!isJsonDataOrNull(new_data)) {
    throw new Error('Registro de auditoria inválido: campo "new_data" deve ser objeto ou null');
  }

  return {
    id,
    executed_at,
    table_name,
    action,
    actor_role,
    old_data,
    new_data,
  };
};

/**
 * Faz o parsing de uma lista de linhas, descartando entradas inválidas
 * (com `console`/log de erro deixado a cargo do chamador via try/catch
 * individual) — usado por `useAuditLogs` para tolerar uma linha malformada
 * sem invalidar a página inteira.
 */
export const parseAuditLogs = (rows: unknown): AuditLogEntry[] => {
  if (!Array.isArray(rows)) {
    throw new Error('Resposta de auditoria inválida: esperado um array de registros');
  }
  return rows.map(parseAuditLog);
};
