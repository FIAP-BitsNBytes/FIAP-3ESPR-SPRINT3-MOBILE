# schedule components

Componentes de apresentação extraídos de `ScheduleScreen` (Onda 3). Todos são puros (sem chamadas a `useAppointments`/Supabase); recebem dados já derivados por `useScheduleView`.

## Purpose

- `AppointmentPeople` — exibe nutricionista/paciente de uma `AppointmentItem` (ícones `Stethoscope`/`User`). Usado por `DailyScheduleView` e `CurrentAppointmentsSection`.
- `ScheduleHeader` — combina o controle segmentado de modo (`Diário/Semanal/Mensal`, só renderizado se `hasAdvancedModes`) com o cabeçalho de navegação de período (chevrons + título).
- `DailyScheduleView` — timeline por hora (`DAY_HOURS`) com as consultas do dia selecionado, agrupadas por hora.
- `WeeklyScheduleView` — lista dos 7 dias da semana, cada card mostra contagem, "Hoje" e até 2 consultas + "+N consultas".
- `MonthlyScheduleView` — grade de calendário do mês com indicador (`dayDot`) nos dias com consultas.
- `CurrentAppointmentsSection` — bloco "Consulta atual": lista consultas em andamento agora (`currentAppointments`).
- `DailyAppointmentsSection` — bloco "Horários do dia": lista `selectedAppointments` usando `AppointmentCard` (`@/shared/components/ui/AppointmentCard`).

## State / Props

### AppointmentPeople
| Prop | Tipo | Descrição |
|---|---|---|
| `appointment` | `AppointmentItem` | Consulta cujo nutricionista/paciente serão exibidos. |

### ScheduleHeader
| Prop | Tipo | Descrição |
|---|---|---|
| `mode` | `ScheduleMode` | Modo atual (`'day' \| 'week' \| 'month'`). |
| `hasAdvancedModes` | `boolean` | Controla a renderização do seletor de modo. |
| `onSelectMode` | `(mode: ScheduleMode) => void` | Callback ao trocar de modo. |
| `periodTitle` | `string` | Título do período (já formatado por `getPeriodTitle`). |
| `onPrev` / `onNext` | `() => void` | Navegação de período. |

### DailyScheduleView
| Prop | Tipo | Descrição |
|---|---|---|
| `hours` | `number[]` | Geralmente `DAY_HOURS` (7h–20h). |
| `appointments` | `AppointmentItem[]` | `selectedAppointments`. |

### WeeklyScheduleView / MonthlyScheduleView
| Prop | Tipo | Descrição |
|---|---|---|
| `weekDays` (semanal) / `calendarDays` (mensal) | `Date[]` / `(Date \| null)[]` | Dias a renderizar. |
| `appointmentsByDate` | `Record<string, AppointmentItem[]>` | Mapa por `toDateKey`. |
| `selectedDateKey` / `todayKey` | `string` | Chaves para destacar seleção/hoje. |
| `onSelectDate` | `(date: Date) => void` | Seleciona o dia ao tocar no card/célula. |

### CurrentAppointmentsSection
| Prop | Tipo | Descrição |
|---|---|---|
| `appointments` | `AppointmentItem[]` | `currentAppointments`. |
| `isAdmin` | `boolean` | Ajusta o texto do estado vazio. |

### DailyAppointmentsSection
| Prop | Tipo | Descrição |
|---|---|---|
| `selectedDate` | `Date` | Usado para exibir `formatSelectedDate`. |
| `appointments` | `AppointmentItem[]` | `selectedAppointments`. |

## Dependencies

- `../../hooks/useAppointments` — tipo `AppointmentItem`.
- `../../utils/scheduleDate` — `formatTime`, `formatShortDay`, `formatSelectedDate`, `toDateKey`, `WEEK_DAYS`, `MODE_OPTIONS`, `ScheduleMode`.
- `./scheduleStyles` — `sharedScheduleStyles` (`currentTimeBadge`/`currentTimeText`), compartilhado entre `DailyScheduleView` e `CurrentAppointmentsSection`.
- `@/shared/components/ui/AppointmentCard` — usado por `DailyAppointmentsSection`.
- `@/shared/theme` — tokens (`colors`, `spacing`, `radius`, `fontSize`, `shadow`).

## Edge Cases

1. **`DailyScheduleView`** — horas sem consultas mostram "Livre"; múltiplas consultas na mesma hora são listadas em sequência dentro do mesmo slot.
2. **`WeeklyScheduleView`** — mostra no máximo 2 consultas por dia; o excedente aparece como "+N consulta(s)" (plural condicional).
3. **`MonthlyScheduleView`** — células vazias (`dayCellEmpty`, antes do dia 1) são desabilitadas (`disabled`, sem `accessibilityRole`).
4. **`CurrentAppointmentsSection`** — texto vazio difere por papel (`isAdmin` vs demais).
5. **`AppointmentPeople`** — renderiza apenas as linhas cujo nome existe (`nutritionistName`/`patientName` podem ser `undefined`).
