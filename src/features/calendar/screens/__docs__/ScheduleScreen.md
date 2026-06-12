# ScheduleScreen

Tela de agenda/calendário. Refatorada na Onda 3 (573 → ~140 linhas): estado e derivações movidos para `useScheduleView`, helpers de data para `utils/scheduleDate`, e a UI dividida em componentes de `components/schedule/`.

## Purpose

- Exibir o título "Agenda" e subtítulo dependente do papel (`isAdmin` vs demais).
- Mostrar estado de loading (`ActivityIndicator`) ou erro.
- Renderizar `ScheduleHeader` (seletor de modo + navegação de período).
- Alternar entre `DailyScheduleView`, `WeeklyScheduleView` e `MonthlyScheduleView` conforme `mode`/`hasAdvancedModes`.
- Renderizar `CurrentAppointmentsSection` (somente se `hasAdvancedModes`) e `DailyAppointmentsSection` (se `!hasAdvancedModes || mode !== 'day'`).

## State / Props

Sem props (tela de rota). Todo o estado vem de `useScheduleView(role)`, onde `role = user?.role ?? 'PATIENT'` (de `useAuthContext`).

### Lógica de renderização (`renderScheduleMode`)

| Condição | View |
|---|---|
| `!hasAdvancedModes \|\| mode === 'month'` | `MonthlyScheduleView` |
| `mode === 'week'` | `WeeklyScheduleView` |
| caso contrário (`mode === 'day'`, com `hasAdvancedModes`) | `DailyScheduleView` |

## Dependencies

- `../hooks/useScheduleView` — view-model completo (estado + derivações + handlers).
- `../utils/scheduleDate` — `DAY_HOURS`, `getPeriodTitle`.
- `../components/schedule` — `ScheduleHeader`, `DailyScheduleView`, `WeeklyScheduleView`, `MonthlyScheduleView`, `CurrentAppointmentsSection`, `DailyAppointmentsSection`.
- `@/features/auth` — `useAuthContext` (papel do usuário).
- `@/shared/theme` — `colors`, `fontSize`, `spacing`.

## Edge Cases

1. **`PATIENT`** — `hasAdvancedModes = false`; sempre mostra `MonthlyScheduleView` + `DailyAppointmentsSection` (já que `mode !== 'day'` é irrelevante quando `!hasAdvancedModes`).
2. **`ADMIN`/`NUTRITIONIST`** — todos os 3 modos disponíveis; `CurrentAppointmentsSection` sempre visível; `DailyAppointmentsSection` só aparece quando `mode !== 'day'` (no modo diário, a timeline já cobre as consultas do dia).
3. **Loading/erro** — `ScheduleHeader`, as views e as seções inferiores não são renderizadas; apenas título/subtítulo + `ActivityIndicator`/mensagem de erro.
4. **Estilos restantes na tela**: `safe`, `content`, `title`, `sub`, `loader`, `errorText` — os demais foram extraídos para os componentes correspondentes.
