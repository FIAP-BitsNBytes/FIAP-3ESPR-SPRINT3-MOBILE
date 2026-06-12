# MealPlanEditorScreen

Tela de nutricionista para visualizar e editar o plano alimentar de um paciente (criar plano, adicionar/editar/remover itens prescritos por refeicao).

## Purpose

- Buscar o plano alimentar ativo do paciente (via `useMealPlan`) e exibir:
  - Estado de carregamento / erro / plano inexistente (com CTA "Criar Plano Alimentar").
  - Card de informacoes do plano (titulo, datas, kcal/dia, contagem de itens/refeicoes/registros do dia, observacoes).
  - Um `MealCard` por refeicao com itens (ordenados por `MEAL_TIME_ORDER`).
- Orquestrar os modais de criacao de plano (`CreatePlanModal`) e de item (`ItemModal`) via `useMealPlanEditorForm`.

Extraida na Onda 3 (T3.1) de um arquivo monolitico de 888 linhas para `src/features/nutritionist/components/meal-plan-editor/` + hook `useMealPlanEditorForm`.

## State / Props

Sem props (rota Expo Router); le `patientId` e `name` via `useLocalSearchParams`.

### De `useMealPlan(patientId, today)`

`items`, `planId`, `planTitle`, `planStartDate`, `planEndDate`, `planNotes`, `isLoading`, `error`, `isSubmitting`, `createPlan`, `upsertItem`, `deleteItem`.

### De `useMealPlanEditorForm({ createPlan, upsertItem })`

`showCreatePlan`, `showItemModal`, `editItem`, `defaultMealTime`, `openCreatePlan`, `closeCreatePlan`, `openAddItem`, `openEditItem`, `closeItemModal`, `handleCreatePlan`, `handleUpsertItem`.

### Memos locais

- `groupedItems` — `Map<MealTimeType, NutritionistPlanItem[]>` agrupando `items` por refeicao.
- `totalKcal` — soma de `prescribedCal` de todos os itens.

## Dependencies

- `../hooks/useMealPlan` — dados e mutacoes do plano (RPC `get_patient_plan_summary`, `create_meal_plan`, `upsert_meal_plan_item`, `delete_meal_plan_item`; realtime em `meal_plan_items`/`meal_plans`).
- `../hooks/useMealPlanEditorForm` — orquestracao de estado dos modais.
- `../components/meal-plan-editor` — `CreatePlanModal`, `ItemModal`, `MealCard`, e `dateParts` (`isoToDisplay` para o card de info do plano).
- `@/features/nutrition` — `MEAL_TIME_ORDER`, tipo `MealTimeType`.
- `@/shared/theme` — `appStyles`, `colors`, `fontSize`, `radius`, `shadow`, `spacing`.
- `expo-router` — `useLocalSearchParams`, `useRouter`.

## Edge Cases

1. **Sem plano ativo (`!planId`)** — exibe estado vazio com CTA que abre `CreatePlanModal`; o FAB "+" do header so aparece quando `planId` existe.
2. **Plano sem itens (`items.length === 0`)** — exibe `emptyItems` com CTA "Adicionar alimento" (abre `ItemModal` com `defaultMealTime = 'BREAKFAST'`).
3. **`ItemModal` so renderiza com `planId` definido** — evita montar o modal de item antes de existir um plano para associar o `UpsertItemParams.planId`.
4. **Remocao de item** — `onDelete` chama `deleteItem(id)` (fire-and-forget, `void`); a lista atualiza via realtime/refresh do `useMealPlan`.
5. **Sucesso em criar plano / salvar item** — `handleCreatePlan`/`handleUpsertItem` (do hook) fecham o modal correspondente apenas quando `result.success === true`; em erro o modal permanece aberto.
