# meal-plan-editor

Componentes de apoio ao `MealPlanEditorScreen`, extraidos do arquivo monolitico original (888 linhas) na Onda 3 (T3.1) em arquivos coesos por responsabilidade.

## Purpose

Fornecer as pecas de UI reutilizaveis do editor de plano alimentar do nutricionista:

- `dateParts.ts` — helpers puros de conversao de data (`isoToDisplay`, `partsToIso`, `isoToParts`).
- `DateField` — input de data em 3 campos (dia/mes/ano) que emite ISO `YYYY-MM-DD`.
- `ChipPicker<T>` — seletor horizontal de chips genérico para campos enum (refeicao, unidade de medida).
- `MealCard` — card de uma refeicao com tabela de itens prescritos e barra de aderencia.
- `modalChrome.ts` — estilos compartilhados de chrome de modal (safe area, header, conteudo).
- `CreatePlanModal` — modal (sheet) de criacao de plano alimentar.
- `ItemModal` — modal (sheet) de criacao/edicao de item prescrito.

## State / Props

### `DateField`

| Prop | Tipo | Descricao |
|---|---|---|
| `label` | `string` | Rotulo do campo. |
| `value` | `string` | Data ISO `YYYY-MM-DD` (ou `''`). |
| `onChange` | `(iso: string) => void` | Chamado quando dia+mes+ano formam uma data ISO valida (10 chars). |
| `optional` | `boolean?` | Quando `true`, adiciona "(opcional)" ao label em vez de `*`. |

Estado interno: `d`, `m`, `y` (strings) sincronizados a partir de `value` na montagem; `refM`/`refY` fazem auto-avanco de foco ao completar 2/2/4 digitos.

### `ChipPicker<T extends string>`

| Prop | Tipo | Descricao |
|---|---|---|
| `options` | `T[]` | Lista de valores possiveis. |
| `value` | `T` | Valor selecionado. |
| `onChange` | `(v: T) => void` | Chamado ao tocar um chip. |
| `labelMap` | `Record<T, string>` | Rotulo exibido por valor. |

### `MealCard`

| Prop | Tipo | Descricao |
|---|---|---|
| `mealTime` | `MealTimeType` | Refeicao exibida (define cor e label via `@/features/nutrition`). |
| `items` | `NutritionistPlanItem[]` | Itens prescritos para a refeicao. |
| `onEdit` | `(item: NutritionistPlanItem) => void` | Abre o `ItemModal` em modo edicao. |
| `onDelete` | `(itemId: string) => void` | Chamado apos confirmacao no `Alert` de remocao. |
| `onAddToMeal` | `(mealTime: MealTimeType) => void` | Abre o `ItemModal` em modo criacao com a refeicao pre-selecionada. |

### `CreatePlanModal`

| Prop | Tipo | Descricao |
|---|---|---|
| `visible` | `boolean` | Visibilidade do `AppModal`. |
| `onClose` | `() => void` | Fecha o modal (botao "Cancelar", back button Android, dismiss do sheet). |
| `onSubmit` | `(form: CreatePlanForm) => void` | Chamado ao tocar "Criar Plano" com `canSubmit === true`. |
| `isSubmitting` | `boolean` | Mostra `ActivityIndicator` no botao e desabilita o submit. |

`CreatePlanForm`: `{ title: string; startDate: string; endDate: string; notes: string }`.

### `ItemModal`

| Prop | Tipo | Descricao |
|---|---|---|
| `visible` | `boolean` | Visibilidade do `AppModal`. |
| `onClose` | `() => void` | Fecha o modal. |
| `onSubmit` | `(params: UpsertItemParams) => void` | Chamado ao tocar "Adicionar"/"Salvar" com `canSubmit === true`. |
| `isSubmitting` | `boolean` | Mostra `ActivityIndicator` no botao e desabilita o submit. |
| `planId` | `string` | Incluido no `UpsertItemParams` enviado. |
| `editItem` | `NutritionistPlanItem \| null` | Se presente, pre-popula o formulario em modo edicao. |
| `defaultMealTime` | `MealTimeType` | Refeicao pre-selecionada quando `editItem` e `null`. |

`ItemForm`: `{ mealTime: MealTimeType; foodName: string; qty: string; unit: MeasurementUnit; calories: string; purpose: string }`.

## Dependencies

- `@/features/nutrition` — `MEAL_TIME_LABELS`, `MEAL_TIME_ORDER`, `MEAL_TIME_COLORS`, `UNIT_LABELS`, `UNIT_OPTIONS`, tipos `MealTimeType`/`MeasurementUnit` (fonte canonica; antes duplicados localmente e re-exportados via `@/features/patient/hooks/useDailyPlan`).
- `@/shared/components/ui/AppModal` — wrapper de modal (`variant="sheet"`, `avoidKeyboard`) usado por `CreatePlanModal` e `ItemModal`, substituindo `<Modal>` cru (corrige `onRequestClose` ausente no Android).
- `@/shared/theme` — `appStyles`, `colors`, `fontSize`, `radius`, `shadow`, `spacing`.
- `../../hooks/useMealPlan` — tipos `NutritionistPlanItem`, `UpsertItemParams`.
- `lucide-react-native` — icones (`Calendar`, `Pencil`, `Plus`, `Trash2`).

## Edge Cases

1. **`tableActionDanger` (MealCard)** — usa `colors.danger + '15'` / `colors.danger + '33'` (hex-alpha) em vez dos antigos `rgba(220,38,38,...)` hardcoded, alinhado ao padrao adotado em `MealItemRow.tsx`.
2. **`DateField` com `value` vazio** — `isoToParts('')` retorna `{ d: '', m: '', y: '' }`; os 3 inputs ficam vazios e `onChange` so dispara quando os 3 campos atingem o tamanho esperado (2/2/4).
3. **`AppModal` sheet no Android/web** — sem `presentationStyle="pageSheet"` (iOS-only); cai para slide full-screen com `flex: 1` + `colors.background`, fornecido pelo proprio `AppModal`. O `SafeAreaView` interno (`modalChrome.modalSafe`, `edges={['top','bottom']}`) continua responsavel pelos insets de safe-area.
4. **`ItemModal` em modo edicao** — `editItem` define os valores iniciais do formulario uma unica vez (estado local via `useState`); reabrir o modal com um `editItem` diferente exige que o componente seja remontado (chave/`visible` toggling), igual ao comportamento anterior.
5. **Remocao de item (`MealCard`)** — `Alert.alert` de confirmacao nativo; `onDelete` so e chamado apos o usuario escolher "Remover" (`style: 'destructive'`).
