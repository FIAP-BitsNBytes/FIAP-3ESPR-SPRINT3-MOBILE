# PatientDetailScreen (NutritionistPatientDetailScreen)

Tela de detalhe do paciente na visão do nutricionista: nível/gamificação, card do plano alimentar, estatísticas, metas de hoje, evolução semanal e um insight textual. Refatorada na Onda 3 (T3.3) — a UI foi extraída para `../components/patient-detail/*`; esta tela mantém os hooks de dados, os cálculos derivados e a composição.

## Purpose

- Buscar dados do paciente (`patientId` via `useLocalSearchParams`): gamificação, logs de hoje, métricas de progresso (7 dias) e plano alimentar ativo.
- Calcular metas dinâmicas a partir do plano (calorias, refeições) com fallback quando não há plano.
- Derivar estatísticas semanais (média, total, melhor dia) e o texto/metadados do insight do nutricionista.
- Compor o layout a partir dos componentes em `../components/patient-detail`.

## State / Props

Sem props (rota Expo Router). Parâmetros de busca: `patientId: string`, `name: string`.

### Hooks consumidos

| Hook | Retorno usado |
|---|---|
| `useGamification(patientId)` | `stats` (`level`, `experience`, `streakDays`), `isLoading` |
| `useTodayLogs(patientId)` | `totalCalories`, `waterMl`, `meals` |
| `useProgressMetrics(patientId)` | `days` (`DailyProgressItem[]`), `isLoading`, `error` |
| `usePlanDetail(patientId)` | `plan`, `items` (planItems), `isLoading` |

### Valores derivados (useMemo / cálculo direto)

| Valor | Descrição |
|---|---|
| `calorieGoal` | Soma de `prescribedCal` dos itens do plano, ou `CALORIE_FALLBACK` (2000) se vazio/zero. |
| `mealGoal` | Nº de itens do plano, ou `MEAL_FALLBACK` (4) se vazio. |
| `todayLoggedCount` | Itens do plano com `logId` preenchido e diferente de `'pending'`. |
| `planAdherencePct` | `round(todayLoggedCount / planItems.length * 100)`, ou `null` se não há plano. |
| `xpInLevel` | `stats.experience % 500`. |
| `mealCount` | Logs de hoje com `category === 'MEAL'`. |
| `weeklyAverage` | Média de calorias dos 7 dias. |
| `weeklyCalTotal` | Soma de calorias dos 7 dias. |
| `bestDay` | Dia com maior `calories`. |
| `insightText` | Mensagem principal (meta atingida ou déficit + %). |
| `insightMeta` | Linha(s) secundárias: % semanal da meta, melhor dia, pendências do plano. |
| `adherenceColor` | Cor por faixa de `planAdherencePct` (`muted` / `success` / `warning` / `danger`). |

## Dependencies

- `@/shared/hooks/useGamification`, `@/features/patient/hooks/useTodayLogs`, `@/features/patient/hooks/useProgressMetrics`, `@/features/nutrition/hooks/usePlanDetail`.
- `@/shared/components/gamification/LevelCard`, `@/shared/components/ui/StatCard`.
- `../components/patient-detail` — `PatientDetailHeader`, `MealPlanEntryCard`, `TodayGoalsSection`, `WeeklyChartsSection`, `InsightCard` (ver doc dedicada em `../components/patient-detail/__docs__/patient-detail-components.md`).
- `@/shared/theme` — `appStyles`, `colors`, `fontSize`, `spacing`.
- `expo-router` — `useLocalSearchParams`, `useRouter`.

## Edge Cases

1. **Sem plano ativo (`plan === null`, `planItems = []`)** — `calorieGoal` cai para `CALORIE_FALLBACK`, `mealGoal` para `MEAL_FALLBACK`, `planAdherencePct = null` (esconde o stat card de adesão e mostra "XP total"); `TodayGoalsSection` usa `mealCount`/`'reg.'` em vez de `todayLoggedCount`/`'itens'`.
2. **`days = []`** — `weeklyAverage = 0` (divisão por `Math.max(length, 1)`), `bestDay = null` (omite a linha "Melhor dia" do `insightMeta`).
3. **`isProgressLoading` / `error`** — indicador de carregamento e mensagem de erro exibidos entre `TodayGoalsSection` e `WeeklyChartsSection`, sem bloquear o restante do layout.
4. **`name` ausente na rota** — `patientName` cai para `'Paciente'`.
5. **Navegação para o plano** — tanto o botão do header quanto o `MealPlanEntryCard` chamam `goToMealPlan`, que navega para `/meal-plan?patientId=...&name=...` (nome codificado via `encodeURIComponent`).
