# usePlanMutations

Mutações do plano alimentar (criar plano, criar/editar/remover item, registrar refeição). Extraído de `usePlanDetail` (Onda 2) para isolar a parte de escrita.

## Purpose

- `createPlan` — cria um novo plano (`create_meal_plan`), requer `patientId`.
- `upsertItem` — cria ou atualiza um item do plano (`upsert_meal_plan_item`).
- `deleteItem` — remove um item do plano (`delete_meal_plan_item`), com atualização otimista.
- `logItem` — registra uma refeição a partir de um item do plano (`log_meal_from_plan`), com atualização otimista.
- Centralizar `isSubmitting` (um único flag para todas as mutações, igual ao comportamento anterior).

## State / Props

### Parâmetros (`UsePlanMutationsParams`)

| Campo | Tipo | Descrição |
|---|---|---|
| `items` | `PlanItem[]` | Lista atual de itens (estado do facade `usePlanDetail`). |
| `setItems` | `(items: PlanItem[]) => void` | Setter de estado do facade — usado para atualização otimista e rollback. |
| `refresh` | `() => void` | `refresh` de `usePlanQuery` — chamado em sucesso para ressincronizar com o servidor. |
| `patientId` | `string \| null \| undefined` | Necessário apenas para `createPlan`. |

### Retorno (`UsePlanMutationsResult`)

| Campo | Tipo | Descrição |
|---|---|---|
| `isSubmitting` | `boolean` | `true` durante qualquer uma das quatro mutações. |
| `createPlan` | `(p: CreatePlanParams) => Promise<ActionResult<{ planId: string }>>` | — |
| `upsertItem` | `(p: UpsertItemParams) => Promise<ActionResult<{ itemId: string }>>` | — |
| `deleteItem` | `(itemId: string) => Promise<ActionResult<void>>` | — |
| `logItem` | `(p: LogItemParams) => Promise<ActionResult<LogItemResult>>` | — |

## Dependencies

- `@/shared/infrastructure/supabase/client` — `supabase.rpc(...)`.
- `../types` — `PlanItem`, `CreatePlanParams`, `UpsertItemParams`, `LogItemParams`, `LogItemResult`, `ActionResult`.

## Edge Cases

1. **`createPlan` sem `patientId`** — retorna `{ success: false, error: 'Paciente não selecionado' }` sem chamar o RPC.
2. **Snapshot-and-rollback em `deleteItem`** — antes de remover o item de `items`, guarda um snapshot. Em erro do RPC (ou exceção), `setItems(snapshot)` restaura a lista — não depende apenas de `refresh()` (que também pode falhar). Em sucesso, chama `refresh()` para buscar o estado canônico do servidor.
3. **Snapshot-and-rollback em `logItem`** — aplica `logId: 'pending'` + `actualQty`/`actualUnit` otimisticamente; em erro/exceção, `setItems(snapshot)` reverte para o estado anterior (corrige o bug em que `logId: 'pending'` ficava preso na UI se o refetch pós-erro também falhasse). Em sucesso, chama `refresh()` e retorna o XP ganho.
4. **Cast do retorno de `log_meal_from_plan`** — o RPC é tipado como `Returns: Json` em `database.types.ts`. O cast `data as { log_id, xp_earned, ... }` é feito com um **type literal inline** (não uma interface nomeada): o checker de overlap do TS rejeita `Json as <interface nomeada>` mesmo com forma idêntica, mas aceita o type literal inline — comportamento documentado e verificado isoladamente.
5. **Erros de rede/exceção** — todos os `catch` retornam `ActionResult` de erro com mensagem amigável em pt-BR e revertem o estado otimista quando aplicável.
