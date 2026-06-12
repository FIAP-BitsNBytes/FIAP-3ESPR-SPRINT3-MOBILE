# usePlanDetail

Facade que combina `usePlanQuery` (leitura) e `usePlanMutations` (escrita) em uma única `PlanDetailState`, mantendo a mesma forma consumida por `PlanDetailContext` e pelas telas de nutrição (`PlanDetailScreen`, `NutritionScreen`, `ProgressScreen`, `PatientDetailScreen`).

## Purpose

- Ponto de entrada único e estável para o estado do plano alimentar — `PlanDetailContext.tsx` e as telas que o consomem não precisam saber que a implementação foi dividida em `usePlanQuery` + `usePlanMutations` (Onda 2).
- Sincronizar o estado local `items` (necessário para atualização otimista das mutações) com os dados vindos de `usePlanQuery` via `useEffect`.

## State / Props

### Parâmetros

| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `patientId` | `string \| null \| undefined` | — | Repassado para `usePlanQuery` e `usePlanMutations` (`createPlan`). |
| `date` | `string \| undefined` | `todayIso()` (via `usePlanQuery`) | Data `YYYY-MM-DD`. |

### Retorno (`PlanDetailState`) — inalterado

| Campo | Origem |
|---|---|
| `items`, `plan`, `isLoading`, `error` | `usePlanQuery` (`items` espelhado em estado local) |
| `isSubmitting` | `usePlanMutations` |
| `refresh` | `usePlanQuery.refresh` |
| `createPlan`, `upsertItem`, `deleteItem`, `logItem` | `usePlanMutations` |

## Dependencies

- `./usePlanQuery` — busca + realtime.
- `./usePlanMutations` — mutações + atualização otimista.
- `../types` — tipos compartilhados (`PlanItem`, `PlanMeta`, `ActionResult`, etc.).

## Edge Cases

1. **`items` local vs `query.items`** — `items` é estado local (`useState`), sincronizado de `query.items` via `useEffect`. Isso permite que `usePlanMutations` aplique atualizações otimistas (`setItems`) sem esperar o refetch, e que `refresh()`/realtime substituam `items` pelo valor canônico do servidor quando o `useEffect` roda de novo.
2. **Compatibilidade de contrato** — a forma de `PlanDetailState` (campos e tipos) é idêntica à versão anterior de 322 linhas; `PlanDetailContext.tsx` e as telas consumidoras não precisaram de alterações.
3. Ver `usePlanQuery.md` e `usePlanMutations.md` para os edge cases específicos de leitura/escrita (rollover de data, canal realtime, snapshot-and-rollback).
