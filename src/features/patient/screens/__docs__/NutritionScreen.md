# PatientNutritionScreen

Tela "Nutrição" do paciente: plano alimentar do dia + registro de água e refeições livres. Refatorada na Onda 3 (T3.4) para extrair UI para `src/features/patient/components/nutrition/` e corrigir literais de cor hardcoded.

## Purpose

- Exibir o plano alimentar prescrito para o dia atual, agrupado por horário de refeição (`MEAL_TIME_ORDER`), com progresso de itens registrados e XP acumulado.
- Permitir registrar o consumo de cada item do plano (`LogItemModal`) e de refeições livres fora do plano (`FreeMealModal`).
- Permitir registrar ingestão de água em incrementos rápidos (`WaterSection`).
- Alternar entre a aba "Meu Plano" e "Água & Extra" via `NutritionTabBar`.

## State / Props

Sem props (tela de rota). Estado interno:

| Estado | Tipo | Descrição |
|---|---|---|
| `selectedItem` | `PlanItem \| null` | Item do plano selecionado para registro (`LogItemModal`). |
| `showFreeMeal` | `boolean` | Visibilidade do `FreeMealModal`. |
| `activeTab` | `Tab` (`'plan' \| 'extras'`) | Aba ativa. |

Valores derivados (via `useMemo`): `freeMeals` (logs de categoria `MEAL`), `loggedCount`, `totalXpToday`, `grouped` (Map de `MealTimeType` → `PlanItem[]`).

## Dependencies

- `@/features/nutrition/hooks/usePlanDetail` — dados do plano do dia + `logItem` + `isSubmitting`; provido via `PlanDetailContext.Provider`.
- `../hooks/useTodayLogs` — `waterMl` + `meals` (logs do dia, incluindo refeições livres).
- `../hooks/useLogWater` — `logWater`, `isLogging`.
- `../hooks/useLogMeal` — `logFreeMeal`, `isLogging`, tipo `LogFreeMealParams`.
- `../hooks/useDailyPlan` — tipo `MeasurementUnit` (usado em `UNIT_LABELS`).
- `../components/nutrition` — `NutritionTabBar` (+ tipo `Tab`), `WaterSection`, `FreeMealModal`.
- `@/features/nutrition/components` — `PlanHeader`, `PlanEmptyState`, `MealSection`, `LogItemModal`.
- `@/features/nutrition/types` — `MEAL_TIME_ORDER`, `MealTimeType`, `PlanItem`, `LogItemParams`.
- `@/shared/theme` — `appStyles`, `colors`, `fontSize`, `radius`, `spacing`.

## Edge Cases

1. **Plano inexistente** — quando `plan` é `null` (sem erro/loading), renderiza `PlanEmptyState`.
2. **Erro de carregamento** — exibe `error` em `styles.errorText` (`colors.danger`) no lugar do conteúdo da aba "Meu Plano".
3. **Progresso 100%** — quando `loggedCount === items.length && items.length > 0`, exibe "Plano completo! Parabéns." (`completeText`, `colors.success`).
4. **Falha ao registrar água/item/refeição livre** — qualquer `result.success === false` dispara `Alert.alert('Erro', result.error)`; o modal correspondente é fechado independentemente do resultado (otimista).
5. **Sem refeições livres** — aba "Água & Extra" exibe `styles.emptySub` ("Nenhum registro livre hoje.") quando `freeMeals.length === 0`.

## Sprint 4 — SmartBottle IoT (novo)

A partir do Sprint 4, a tela instancia `useSmartBottle()` e passa o estado como props para `SmartBottleCard`:

```tsx
const { status, lastReading, connect, disconnect, error } = useSmartBottle();
// ...
<SmartBottleCard
  status={status}
  lastReading={lastReading}
  onConnect={connect}
  onDisconnect={disconnect}
  error={error}
/>
```

O card é exibido na aba "Água & Extra". Leituras IoT são inseridas automaticamente em `meal_logs` (via MQTT/Supabase) e propagadas pelo realtime existente do `useTodayLogs` — a barra de hidratação atualiza sem refresh manual.

## Color Convention

Os 3 chips do `summaryRow` relacionados à água (`backgroundColor`, ícone `Droplets`, texto) usam `colors.waterAccent` em vez do literal `'#38BDF8'`. Demais ocorrências de `#38BDF8` foram extraídas para `WaterSection` e `WaterBar` (ver `src/features/patient/components/nutrition/__docs__/nutrition-components.md`).
