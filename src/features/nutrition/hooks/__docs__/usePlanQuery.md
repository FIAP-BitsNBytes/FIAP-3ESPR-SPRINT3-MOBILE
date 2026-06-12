# usePlanQuery

Busca dos dados do plano alimentar (itens + metadados) com Realtime. Extraído de `usePlanDetail` (Onda 2) para isolar a parte de leitura sobre `useSupabaseQuery`.

## Purpose

- Buscar o plano alimentar de um paciente em uma data específica, com comportamento dual:
  - **`canEdit` (nutricionista/admin)** → RPC `get_patient_plan_summary(p_patient_id, p_date)`. Se não houver itens, busca os metadados em `meal_plans` (plano pode existir vazio).
  - **Paciente (self-view)** → RPC `get_today_plan(p_date)` + metadados do plano ativo em `meal_plans` (filtrado por `patient_id`, `is_active`, intervalo `start_date`/`end_date`).
- Mapear as linhas (snake_case) para `PlanItem` / `PlanMeta` (camelCase) usados pela UI.
- Manter um canal Realtime único (`meal_logs` filtrado pelo paciente/usuário alvo + `meal_plan_items` sem filtro) que dispara refetch.

## State / Props

### Parâmetros

| Parâmetro | Tipo | Default | Descrição |
|---|---|---|---|
| `patientId` | `string \| null \| undefined` | — | Obrigatório quando `canEdit` é `true`. Ignorado na visão do paciente (usa `user.id`). |
| `date` | `string \| undefined` | `todayIso()` | Data `YYYY-MM-DD` (local). |

### Retorno (`UsePlanQueryResult`)

| Campo | Tipo | Descrição |
|---|---|---|
| `items` | `PlanItem[]` | Itens do plano mapeados (`[]` se não houver dados). |
| `plan` | `PlanMeta \| null` | Metadados do plano ativo/relevante. |
| `isLoading` | `boolean` | Repassado de `useSupabaseQuery`. |
| `error` | `string \| null` | Repassado de `useSupabaseQuery`. |
| `refresh` | `() => void` | Bump de tick → refetch + recria canal. |

## Dependencies

- `@/shared/hooks/useSupabaseQuery` — fetch + realtime genérico (canal único, criado sincronamente).
- `@/shared/utils/date` — `todayIso()` (data local `YYYY-MM-DD`, evita rollover de fuso UTC).
- `@/features/auth/context/AuthContext` — `user.id` para a visão do paciente.
- `./usePlanPermissions` — `canEdit` decide a estratégia de fetch.
- `@/shared/infrastructure/supabase/client`.

### Tipagem das linhas RPC/tabela

Sem `Record<string, unknown>[]` + `as` por campo. Cada fonte tem uma interface nomeada com as colunas snake_case (`PatientPlanSummaryRow`, `TodayPlanRow`, `MealPlanRow`), com **um único cast** no limite do RPC/query (`data as RowType[]`). O mapeamento para `PlanItem`/`PlanMeta` usa acesso de propriedade normal, sem casts adicionais.

## Edge Cases

1. **`date` não informado** — usa `todayIso()` (data local), não `new Date().toISOString().slice(0,10)` (UTC). Corrige o bug de rollover de dia perto da meia-noite em fusos negativos (ex.: 23h locais já seria "amanhã" em UTC).
2. **`targetId` ausente** (`canEdit` sem `patientId`, ou paciente sem `user.id`) — `enabled: false`; sem fetch, sem canal; retorna `{ items: [], plan: null }`.
3. **Plano do nutricionista sem itens** — `get_patient_plan_summary` retorna `[]`; busca metadados em `meal_plans` via `maybeSingle()`. `plan` pode ser `null` se não houver plano ativo.
4. **Canal Realtime** — criado sincronamente por `useSupabaseQuery` antes do primeiro fetch resolver, com nome único via `uniqueChannelName('plan-detail', ...)` internamente; removido no cleanup do efeito (mudança de deps ou unmount). Não há mais o bug de "canal criado após `cancelled = true`".
5. **Falha de refetch** — `useSupabaseQuery` mantém `items`/`plan` anteriores (stale) e preenche apenas `error`; `data` só vira `null` em falha de carga inicial.
