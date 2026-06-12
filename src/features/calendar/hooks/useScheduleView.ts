import { useMemo, useState } from 'react';
import { UserRole } from '@/features/auth/domain/auth';
import { AppointmentItem, useAppointments } from './useAppointments';
import {
  addDays,
  addMonths,
  buildCalendarDays,
  isAppointmentHappeningNow,
  ScheduleMode,
  startOfWeek,
  toDateKey,
} from '../utils/scheduleDate';

interface UseScheduleViewResult {
  appointments: AppointmentItem[];
  isLoading: boolean;
  error: string | null;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  mode: ScheduleMode;
  selectMode: (nextMode: ScheduleMode) => void;
  movePeriod: (direction: -1 | 1) => void;
  appointmentsByDate: Record<string, AppointmentItem[]>;
  selectedAppointments: AppointmentItem[];
  weekDays: Date[];
  calendarDays: (Date | null)[];
  currentAppointments: AppointmentItem[];
  hasAdvancedModes: boolean;
  isAdmin: boolean;
  selectedDateKey: string;
  todayKey: string;
}

export const useScheduleView = (role: UserRole): UseScheduleViewResult => {
  const { appointments, isLoading, error } = useAppointments(role);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [mode, setMode] = useState<ScheduleMode>('day');

  const selectedDateKey = toDateKey(selectedDate);
  const todayKey = toDateKey(new Date());
  const hasAdvancedModes = role === 'ADMIN' || role === 'NUTRITIONIST';
  const isAdmin = role === 'ADMIN';

  const appointmentsByDate = useMemo(() => {
    return appointments.reduce<Record<string, AppointmentItem[]>>((acc, appointment) => {
      const key = toDateKey(new Date(appointment.scheduledAt));
      acc[key] = [...(acc[key] ?? []), appointment];
      return acc;
    }, {});
  }, [appointments]);

  const selectedAppointments = useMemo(() => (
    [...(appointmentsByDate[selectedDateKey] ?? [])].sort(
      (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    )
  ), [appointmentsByDate, selectedDateKey]);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  }, [selectedDate]);

  const calendarDays = useMemo(() => buildCalendarDays(selectedDate), [selectedDate]);

  const currentAppointments = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(appointment => isAppointmentHappeningNow(appointment, now))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [appointments]);

  const movePeriod = (direction: -1 | 1) => {
    const effectiveMode = hasAdvancedModes ? mode : 'month';

    if (effectiveMode === 'day') {
      setSelectedDate(current => addDays(current, direction));
      return;
    }

    if (effectiveMode === 'week') {
      setSelectedDate(current => addDays(current, direction * 7));
      return;
    }

    setSelectedDate(current => addMonths(current, direction));
  };

  const selectMode = (nextMode: ScheduleMode) => {
    setMode(nextMode);
  };

  return {
    appointments,
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    mode,
    selectMode,
    movePeriod,
    appointmentsByDate,
    selectedAppointments,
    weekDays,
    calendarDays,
    currentAppointments,
    hasAdvancedModes,
    isAdmin,
    selectedDateKey,
    todayKey,
  };
};
