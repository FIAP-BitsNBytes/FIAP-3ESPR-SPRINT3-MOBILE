# patient-detail components

Componentes de apresentação extraídos de `NutritionistPatientDetailScreen` (Onda 3, T3.3) para reduzir o tamanho da tela e isolar blocos visuais reutilizáveis/cohesos. Todos são puramente apresentacionais (sem fetch de dados); a tela continua responsável por hooks, cálculos derivados e navegação.

## Purpose

Cada arquivo encapsula uma seção visual da tela de detalhe do paciente (visão do nutricionista):

- **`GoalBar`** — barra de progresso de uma meta (label, valor atual/meta, percentual).
- **`WeeklyChart`** — gráfico de barras semanal genérico (calorias, água, etc.), com destaque para o dia atual.
- **`PatientDetailHeader`** — cabeçalho da tela: botão voltar, nome/subtítulo do paciente, botão de navegação para o plano alimentar.
- **`MealPlanEntryCard`** — card "Plano Alimentar" (touchable) que resume o plano ativo (título, nº de itens, % de adesão) ou oferece "Criar plano" quando não há plano.
- **`TodayGoalsSection`** — seção "Metas de hoje", compondo 4 `GoalBar` (Calorias, Água, Refeições, Sequência).
- **`WeeklyChartsSection`** — seção "Evolução semanal", compondo 2 `WeeklyChart` (Calorias e Água).
- **`InsightCard`** — card de "Análise do nutricionista" com texto de insight principal e metadados opcionais.

## State / Props

### `GoalBar`

| Prop | Tipo | Descrição |
|---|---|---|
| `label` | `string` | Nome da meta (ex.: "Calorias"). |
| `value` | `number` | Valor atual. |
| `goal` | `number` | Valor da meta. |
| `unit` | `string` | Unidade exibida (ex.: "kcal", "ml", "dias"). |
| `color` | `string` | Cor da barra de progresso e do texto de percentual. |

Sem estado interno; `progress = min(round(value/goal*100), 100)`.

### `WeeklyChart`

| Prop | Tipo | Descrição |
|---|---|---|
| `title` | `string` | Título do gráfico. |
| `days` | `DailyProgressItem[]` | Dados diários (de `@/features/patient/hooks/useProgressMetrics`). |
| `getValue` | `(day: DailyProgressItem) => number` | Extrai o valor plotado de cada dia. |
| `goal` | `number` | Meta diária (usada para normalizar altura das barras e cor). |
| `unit` | `string` | Unidade exibida na legenda da meta. |
| `todayKey` | `string` | `dateKey` (YYYY-MM-DD) do dia atual, usado para destacar a coluna. |

Cor de cada barra: cinza (`colors.border`) se `value === 0`; verde/amarelo/vermelho conforme `value/goal` >= 0.8 / >= 0.5 / abaixo.

### `PatientDetailHeader`

| Prop | Tipo | Descrição |
|---|---|---|
| `patientName` | `string` | Nome exibido no título. |
| `onBack` | `() => void` | Callback do botão voltar. |
| `onOpenMealPlan` | `() => void` | Callback do botão de navegação para o plano alimentar. |

### `MealPlanEntryCard`

| Prop | Tipo | Descrição |
|---|---|---|
| `plan` | `PlanMeta \| null` | Metadados do plano ativo (de `@/features/nutrition`). |
| `planItems` | `PlanItem[]` | Itens do plano ativo. |
| `isPlanLoading` | `boolean` | Exibe "Carregando..." enquanto `true`. |
| `planAdherencePct` | `number \| null` | % de adesão hoje; `null` esconde o trecho "· X% adesão hoje". |
| `onPress` | `() => void` | Navega para a tela de plano alimentar. |

### `TodayGoalsSection`

| Prop | Tipo | Descrição |
|---|---|---|
| `totalCalories` | `number` | Calorias consumidas hoje. |
| `calorieGoal` | `number` | Meta calórica (do plano ou fallback). |
| `waterMl` | `number` | Água consumida hoje (ml). |
| `waterGoalMl` | `number` | Meta de água (ml). |
| `mealValue` | `number` | Itens do plano logados hoje, ou contagem de refeições registradas (sem plano). |
| `mealGoal` | `number` | Nº de itens do plano, ou fallback de refeições. |
| `mealUnit` | `string` | `'itens'` (com plano) ou `'reg.'` (sem plano). |
| `streakDays` | `number` | Sequência atual (dias). |
| `streakGoal` | `number` | Meta de sequência (`STREAK_GOAL`). |

### `WeeklyChartsSection`

| Prop | Tipo | Descrição |
|---|---|---|
| `days` | `DailyProgressItem[]` | Dados semanais. |
| `calorieGoal` | `number` | Meta calórica diária (gráfico de Calorias). |
| `waterGoalMl` | `number` | Meta de água diária em ml (convertida para litros no gráfico de Água). |
| `today` | `string` | `dateKey` do dia atual, repassado a ambos os `WeeklyChart` como `todayKey`. |

### `InsightCard`

| Prop | Tipo | Descrição |
|---|---|---|
| `insightText` | `string` | Texto principal do insight (sempre exibido). |
| `insightMeta` | `string` | Texto secundário; se vazio (`''`), a linha de metadados não é renderizada. |

## Dependencies

- `@/shared/theme` — `colors`, `fontSize`, `radius`, `shadow`, `spacing`, `appStyles` (estilos e `sectionTitle`).
- `@/features/patient/hooks/useProgressMetrics` — tipo `DailyProgressItem` (usado por `WeeklyChart` e `WeeklyChartsSection`).
- `@/features/nutrition` — tipos `PlanItem`, `PlanMeta` (usado por `MealPlanEntryCard`).
- `lucide-react-native` — ícones (`ArrowLeft`, `ClipboardList`, `ChevronRight`, `Plus`, `Target`).

## Edge Cases

1. **`GoalBar` com `goal === 0`** — divisão por zero produziria `NaN`/`Infinity`; não ocorre na prática pois todas as metas atuais (`calorieGoal`, `WATER_GOAL_ML`, `mealGoal`, `STREAK_GOAL`) são positivas por construção (fallbacks aplicados na tela).
2. **`WeeklyChart` sem dias (`days = []`)** — `barsRow` fica vazio; `maxValue = Math.max(goal, 1)` evita divisão por zero na altura das barras.
3. **`MealPlanEntryCard` sem plano (`plan === null`)** — renderiza o bloco "Criar plano" em vez do resumo; `planAdherencePct` é ignorado nesse caso.
4. **`InsightCard` com `insightMeta` vazio** — a `<Text>` de metadados não é renderizada (`insightMeta ? <Text>... : null`), evitando espaço vazio extra.
5. **`TodayGoalsSection` / `WeeklyChartsSection`** — são puramente apresentacionais; toda a lógica de fallback (`CALORIE_FALLBACK`, `MEAL_FALLBACK`, etc.) permanece em `NutritionistPatientDetailScreen`, que passa valores já resolvidos.
