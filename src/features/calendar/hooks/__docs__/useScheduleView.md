# useScheduleView

Hook de view-model para `ScheduleScreen`. Extraído da tela (Onda 3) para isolar estado de navegação do calendário e derivações de `useAppointments`.

## Purpose

- Chamar `useAppointments(role)` e expor `appointments`/`isLoading`/`error`.
- Possuir o estado de navegação do calendário: `selectedDate` (data selecionada) e `mode` (`'day' | 'week' | 'month'`).
- Derivar, via `useMemo`, todas as estruturas usadas pelas views (diária/semanal/mensal):
  - `appointmentsByDate` — consultas agrupadas por chave `YYYY-MM-DD`.
  - `selectedAppointments` — consultas do dia selecionado, ordenadas por horário.
  - `weekDays` — os 7 dias da semana corrente (a partir de `startOfWeek`).
  - `calendarDays` — grade do mês corrente (`Date | null` para preencher dias vazios).
  - `currentAppointments` — consultas em andamento agora (`isAppointmentHappeningNow`).
- Expor os handlers `movePeriod(direction)` (navega dia/semana/mês conforme `mode`) e `selectMode(nextMode)`.
- Expor flags derivadas: `hasAdvancedModes` (ADMIN/NUTRITIONIST), `isAdmin`, `selectedDateKey`, `todayKey`.

## State / Props

### Parâmetros

| Parâmetro | Tipo | Descrição |
|---|---|---|
| `role` | `UserRole` (`'PATIENT' \| 'NUTRITIONIST' \| 'ADMIN'`) | Papel ativo do usuário; repassado para `useAppointments(role)` e usado para derivar `hasAdvancedModes`/`isAdmin`. |

### Retorno (`UseScheduleViewResult`)

| Campo | Tipo | Descrição |
|---|---|---|
| `appointments` | `AppointmentItem[]` | Lista bruta vinda de `useAppointments`. |
| `isLoading` | `boolean` | Repassado de `useAppointments`. |
| `error` | `string \| null` | Repassado de `useAppointments`. |
| `selectedDate` | `Date` | Data atualmente selecionada (inicial: hoje). |
| `setSelectedDate` | `(date: Date) => void` | Seleciona uma data (usado pelas views semanal/mensal). |
| `mode` | `ScheduleMode` | Modo de visualização atual. |
| `selectMode` | `(mode: ScheduleMode) => void` | Troca o modo de visualização. |
| `movePeriod` | `(direction: -1 \| 1) => void` | Navega para o período anterior/seguinte, considerando `mode` e `hasAdvancedModes`. |
| `appointmentsByDate` | `Record<string, AppointmentItem[]>` | Consultas agrupadas por `toDateKey`. |
| `selectedAppointments` | `AppointmentItem[]` | Consultas do dia selecionado (ordenadas). |
| `weekDays` | `Date[]` | 7 dias da semana corrente. |
| `calendarDays` | `(Date \| null)[]` | Grade do mês corrente. |
| `currentAppointments` | `AppointmentItem[]` | Consultas em andamento agora (ordenadas). |
| `hasAdvancedModes` | `boolean` | `true` para ADMIN/NUTRITIONIST (habilita modos semanal/mensal). |
| `isAdmin` | `boolean` | `true` para ADMIN. |
| `selectedDateKey` | `string` | `toDateKey(selectedDate)`. |
| `todayKey` | `string` | `toDateKey(new Date())`. |

## Dependencies

- `./useAppointments` — fetch + realtime de `appointments`.
- `@/features/auth/domain/auth` — tipo `UserRole`.
- `../utils/scheduleDate` — helpers puros de data/formato (`toDateKey`, `startOfWeek`, `addDays`, `addMonths`, `buildCalendarDays`, `isAppointmentHappeningNow`, `ScheduleMode`).

## Edge Cases

1. **`PATIENT`** — `hasAdvancedModes` é `false`; `mode` permanece `'day'`, mas a UI ignora o seletor de modo e usa visão mensal (a tela trata isso via `getPeriodTitle(hasAdvancedModes ? mode : 'month', ...)` e `MonthlyScheduleView`).
2. **`movePeriod` sem modos avançados** — usa `effectiveMode = 'month'` internamente, independente de `mode`.
3. **Sem consultas** — `appointmentsByDate` é `{}`; `selectedAppointments`/`currentAppointments` são `[]`; views renderizam estados vazios.
4. **Erro/loading** — repassados sem transformação; a tela decide o que renderizar.
