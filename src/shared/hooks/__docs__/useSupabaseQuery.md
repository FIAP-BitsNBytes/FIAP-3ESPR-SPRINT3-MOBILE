# useSupabaseQuery

## Purpose

Hook genérico e tipado de busca de dados com Supabase + Realtime. Centraliza o padrão duplicado em 10+ hooks da aplicação (`useTodayLogs`, `useDashboardStats`, `useAuditLogs`, `useClinicPatients`, `useGamification`, etc.):

- `useState` para `data` / `isLoading` / `error`;
- `useEffect` com flag `cancelled`;
- fetch assíncrono;
- canal Supabase Realtime com subscribe;
- cleanup (cancelamento + remoção do canal).

Bugs estruturalmente prevenidos pelo design:

| Bug nos hooks existentes | Como o hook previne |
|---|---|
| Canal criado APÓS o fetch resolver, sem checar `cancelled` → leak de subscribe-após-cleanup | Canal criado **sincronamente** no início do efeito, antes de qualquer `await`; o cleanup sempre tem o handle |
| Canal não removido quando deps mudam | `supabase.removeChannel(channel)` no cleanup do próprio efeito, que reexecuta a cada mudança de deps |
| Nomes de canal hardcoded compartilhados entre instâncias (ex.: `'audit-logs-realtime'`) | Nome sempre gerado via `uniqueChannelName(channelPrefix)` (timestamp + contador monotônico + random) |
| Várias tabelas mudando ao mesmo tempo → rajada de refetches duplicados | N tabelas em **um único canal** + `realtimeDebounceMs` opcional que colapsa a rajada em um refetch |

## API

### Assinatura

```ts
function useSupabaseQuery<T>(options: UseSupabaseQueryOptions<T>): UseSupabaseQueryResult<T>
```

### Options (`UseSupabaseQueryOptions<T>`)

| Campo | Tipo | Default | Descrição |
|---|---|---|---|
| `fetcher` | `() => Promise<T>` | — | Função de busca. Deve **lançar** em caso de erro (não retornar `{ error }`). |
| `enabled` | `boolean` | `true` | `false` → sem fetch, sem canal, `isLoading` fica `false`. Útil quando a query depende de `user?.id` ainda não resolvido. |
| `channelPrefix` | `string` | — | Prefixo passado a `uniqueChannelName`; nunca usado como nome literal de canal. |
| `realtime` | `RealtimeSpec[]` | `undefined` | N tabelas monitoradas em UM único canal. Omitido/vazio → nenhum canal é criado. |
| `realtimeDebounceMs` | `number` | `undefined` | Se definido (> 0), eventos realtime em rajada disparam um único refetch após o intervalo. |
| `deps` | `ReadonlyArray<unknown>` | — | Reexecuta o efeito (fetch + recriação do canal) quando esses valores mudam. |

### `RealtimeSpec`

| Campo | Tipo | Default |
|---|---|---|
| `table` | `string` | — |
| `schema` | `string` | `'public'` |
| `event` | `'*' \| 'INSERT' \| 'UPDATE' \| 'DELETE'` | `'*'` |
| `filter` | `string` (ex.: `'clinic_id=eq.<uuid>'`) | `undefined` |

### Result (`UseSupabaseQueryResult<T>`)

| Campo | Tipo | Descrição |
|---|---|---|
| `data` | `T \| null` | `null` antes da primeira carga ou após falha inicial. |
| `isLoading` | `boolean` | `true` durante fetch disparado por mount/deps/refresh. |
| `error` | `string \| null` | Mensagem normalizada (Error, string ou objeto com `message`). |
| `refresh` | `() => void` | Bump de tick interno → reexecuta o efeito (fetch + canal novos). |

### Exemplo de uso

```ts
const { data, isLoading, error, refresh } = useSupabaseQuery<MealLogItem[]>({
  fetcher: async () => {
    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('patient_id', patientId);
    if (error) throw error;
    return data;
  },
  enabled: Boolean(patientId),
  channelPrefix: 'today-logs',
  realtime: [{ table: 'meal_logs', filter: `patient_id=eq.${patientId}` }],
  realtimeDebounceMs: 300,
  deps: [patientId],
});
```

## State / Internals

- `data`, `isLoading`, `error`: estado exposto.
- `tick`: contador interno bumpado por `refresh()` — entra na dependency key do efeito.
- `fetcherRef` / `realtimeRef`: refs sempre atualizadas a cada render; o efeito usa a versão mais recente **sem** reexecutar quando a identidade da função/array muda (evita loop infinito com closures inline).
- `hasLoadedOnceRef`: persiste entre execuções do efeito; distingue falha inicial de falha de refetch.

## Dependencies

- `@/shared/infrastructure/supabase/client` — cliente Supabase singleton.
- `@/shared/utils/realtime` — `uniqueChannelName` (timestamp + contador monotônico + sufixo aleatório).
- React: `useState`, `useEffect`, `useRef`, `useCallback`.

## Edge Cases

1. **Unmount durante fetch pendente** — flag `cancelled` é checada após **todo** `await`; nenhum `setState` ocorre após o cleanup. O canal é removido mesmo com fetch em voo (foi criado sincronamente antes do primeiro `await`).
2. **`enabled: false`** — nenhum fetch, nenhum canal, `isLoading` é `false` (inclusive no estado inicial, via `useState(enabled)`). `data`/`error` anteriores são preservados ao transicionar `true → false`.
3. **Falha de refetch mantém dados stale (decisão documentada)** — quando um refetch (evento realtime ou `refresh()`) falha após um sucesso anterior, `data` permanece com o último valor válido e apenas `error` é preenchido. `data` só vira `null` quando a falha ocorre antes de qualquer sucesso (carga inicial). Racional: em telas em tempo real, é melhor mostrar dados ligeiramente desatualizados com um aviso de erro do que apagar a tela.
4. **Mudança de deps** — o cleanup remove o canal antigo e o efeito recria fetch + canal com os novos valores. Como `hasLoadedOnceRef` persiste, dados stale da query anterior continuam visíveis até o novo fetch resolver (evita flash de tela vazia).
5. **Rajada de eventos realtime** — com `realtimeDebounceMs`, eventos consecutivos (várias tabelas mudando numa mesma transação) reiniciam o timer; apenas um refetch ocorre. O timer é cancelado no cleanup (sem refetch fantasma após unmount).
6. **Erros não-`Error`** — normalização por narrowing seguro: `Error.message` → string direta → objeto com `message: string` (PostgrestError) → fallback `'Erro inesperado ao carregar dados'`. Sem `any` e sem casts.
7. **Eventos realtime após cleanup** — o handler `scheduleRefetch` também checa `cancelled` antes de agendar/executar; eventos entregues durante o teardown não disparam fetch.
8. **`event` como união de literais** — as overloads do supabase-js exigem o literal exato (`'*' | 'INSERT' | ...`); o helper `attachRealtimeListener` resolve via `switch`, mantendo type-safety sem casts.
