# useMealPlanEditorForm

Hook de orquestracao de modais para `MealPlanEditorScreen`. Extraido do estado inline (Onda 3, T3.1) para isolar a logica de abrir/fechar `CreatePlanModal` e `ItemModal` do componente de tela.

## Purpose

- Centralizar o estado de UI dos dois modais do editor de plano alimentar:
  - `showCreatePlan` — visibilidade do modal de criacao de plano.
  - `showItemModal` + `editItem` — visibilidade do modal de item e qual item (se algum) esta sendo editado.
  - `defaultMealTime` — refeicao pre-selecionada ao abrir o modal de item via "Add" de um `MealCard`.
- Encapsular os handlers que chamam `createPlan` / `upsertItem` (vindos de `useMealPlan`) e fecham o modal correspondente apenas em caso de sucesso, preservando o comportamento original da tela.

## State / Props

### Parametros (`UseMealPlanEditorFormParams`)

| Parametro | Tipo | Descricao |
|---|---|---|
| `createPlan` | `(params: CreatePlanParams) => Promise<{ success: true; planId: string } \| { success: false; error: string }>` | Repassado de `useMealPlan`. |
| `upsertItem` | `(params: UpsertItemParams) => Promise<{ success: true; itemId: string } \| { success: false; error: string }>` | Repassado de `useMealPlan`. |

### Retorno (`UseMealPlanEditorFormReturn`)

| Campo | Tipo | Descricao |
|---|---|---|
| `showCreatePlan` | `boolean` | Visibilidade do `CreatePlanModal`. |
| `showItemModal` | `boolean` | Visibilidade do `ItemModal`. |
| `editItem` | `NutritionistPlanItem \| null` | Item em edicao, ou `null` para criacao. |
| `defaultMealTime` | `MealTimeType` | Refeicao padrao para novos itens (default `'BREAKFAST'`). |
| `openCreatePlan` | `() => void` | Abre o modal de criacao de plano. |
| `closeCreatePlan` | `() => void` | Fecha o modal de criacao de plano. |
| `openAddItem` | `(mealTime?: MealTimeType) => void` | Abre o modal de item em modo criacao, com `defaultMealTime` opcional (default `'BREAKFAST'`); limpa `editItem`. |
| `openEditItem` | `(item: NutritionistPlanItem) => void` | Abre o modal de item em modo edicao com o item informado. |
| `closeItemModal` | `() => void` | Fecha o modal de item e limpa `editItem`. |
| `handleCreatePlan` | `(form: CreatePlanForm) => Promise<void>` | Chama `createPlan` mapeando `CreatePlanForm` → `CreatePlanParams` (`endDate`/`notes` vazios viram `null`); fecha o modal em sucesso. |
| `handleUpsertItem` | `(params: UpsertItemParams) => Promise<void>` | Chama `upsertItem`; fecha o modal de item (e limpa `editItem`) em sucesso. |

## Dependencies

- `@/features/nutrition` — tipo `MealTimeType`.
- `../hooks/useMealPlan` — tipos `CreatePlanParams`, `NutritionistPlanItem`, `UpsertItemParams` (hook nao e importado, apenas seus tipos; a instancia e criada na tela e repassada via `createPlan`/`upsertItem`).
- `../components/meal-plan-editor` — tipo `CreatePlanForm` (formato de formulario do `CreatePlanModal`).

## Edge Cases

1. **Cancelamento de edicao** — `closeItemModal` sempre limpa `editItem`, mesmo se chamado fora de um submit (ex.: botao "Cancelar" do modal), evitando que o proximo `openAddItem` reabra com dados de edicao residuais.
2. **Falha em `createPlan`/`upsertItem`** — se `result.success` for `false`, o modal correspondente permanece aberto para o usuario corrigir o formulario; nenhuma mensagem de erro e tratada aqui (delegado ao formulario/`useMealPlan`).
3. **`openAddItem()` sem argumento** — usa `'BREAKFAST'` como `defaultMealTime`, igual ao comportamento original do FAB de adicionar item no header.
4. **`CreatePlanForm.endDate`/`notes` vazios** — `handleCreatePlan` converte strings vazias para `null` antes de chamar `createPlan`, preservando a semantica de "sem data de termino" / "sem observacoes".
