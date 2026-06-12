import { AppointmentItem } from '../hooks/useAppointments';

export type ScheduleMode = 'day' | 'week' | 'month';

export const MODE_OPTIONS: { value: ScheduleMode; label: string }[] = [
  { value: 'day', label: 'Diário' },
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
];

export const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
export const DAY_HOURS = Array.from({ length: 14 }, (_, index) => index + 7);
export const APPOINTMENT_DURATION_MINUTES = 60;

export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatSelectedDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

export const formatShortDay = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export const startOfWeek = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
};

export const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

export const buildCalendarDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const leadingEmptyDays = firstDay.getDay();

  return [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => (
      new Date(monthDate.getFullYear(), monthDate.getMonth(), index + 1)
    )),
  ];
};

export const isAppointmentHappeningNow = (appointment: AppointmentItem, now: Date) => {
  if (appointment.status === 'CANCELLED') return false;

  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + APPOINTMENT_DURATION_MINUTES * 60 * 1000);
  return now >= start && now <= end;
};

export const getPeriodTitle = (mode: ScheduleMode, selectedDate: Date) => {
  if (mode === 'day') return formatSelectedDate(selectedDate);
  if (mode === 'week') {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = addDays(weekStart, 6);
    return `${formatShortDay(weekStart)} - ${formatShortDay(weekEnd)}`;
  }
  return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};
