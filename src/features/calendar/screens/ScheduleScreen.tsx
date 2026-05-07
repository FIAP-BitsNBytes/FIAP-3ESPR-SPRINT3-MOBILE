import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Clock, Stethoscope, User } from 'lucide-react-native';
import { AppointmentCard } from '@/shared/components/ui/AppointmentCard';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';
import { AppointmentItem, useAppointments } from '../hooks/useAppointments';

type ScheduleMode = 'day' | 'week' | 'month';

const MODE_OPTIONS: { value: ScheduleMode; label: string }[] = [
  { value: 'day', label: 'Diário' },
  { value: 'week', label: 'Semanal' },
  { value: 'month', label: 'Mensal' },
];

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const DAY_HOURS = Array.from({ length: 14 }, (_, index) => index + 7);
const APPOINTMENT_DURATION_MINUTES = 60;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatSelectedDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

const formatShortDay = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay());
  return result;
};

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

const buildCalendarDays = (monthDate: Date) => {
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

const isAppointmentHappeningNow = (appointment: AppointmentItem, now: Date) => {
  if (appointment.status === 'CANCELLED') return false;

  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + APPOINTMENT_DURATION_MINUTES * 60 * 1000);
  return now >= start && now <= end;
};

const getPeriodTitle = (mode: ScheduleMode, selectedDate: Date) => {
  if (mode === 'day') return formatSelectedDate(selectedDate);
  if (mode === 'week') {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = addDays(weekStart, 6);
    return `${formatShortDay(weekStart)} - ${formatShortDay(weekEnd)}`;
  }
  return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export function ScheduleScreen() {
  const { user } = useAuthContext();
  const role = user?.role ?? 'PATIENT';
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

  const renderAppointmentPeople = (appointment: AppointmentItem) => (
    <View style={styles.compactPeople}>
      {appointment.nutritionistName ? (
        <View style={styles.personRow}>
          <Stethoscope size={14} color={colors.primary} />
          <Text style={styles.personText}>{appointment.nutritionistName}</Text>
        </View>
      ) : null}
      {appointment.patientName ? (
        <View style={styles.personRow}>
          <User size={14} color={colors.success} />
          <Text style={styles.personText}>{appointment.patientName}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderDailyView = () => (
    <View style={styles.timelineCard}>
      {DAY_HOURS.map(hour => {
        const hourAppointments = selectedAppointments.filter(appointment =>
          new Date(appointment.scheduledAt).getHours() === hour
        );

        return (
          <View key={hour} style={styles.timelineRow}>
            <Text style={styles.hourLabel}>{String(hour).padStart(2, '0')}:00</Text>
            <View style={styles.hourSlot}>
              {hourAppointments.length === 0 ? (
                <Text style={styles.freeText}>Livre</Text>
              ) : (
                hourAppointments.map(appointment => (
                  <View key={appointment.id} style={styles.slotAppointment}>
                    <View style={styles.slotTopRow}>
                      <View style={styles.currentTimeBadge}>
                        <Clock size={13} color={colors.warning} />
                        <Text style={styles.currentTimeText}>{formatTime(new Date(appointment.scheduledAt))}</Text>
                      </View>
                      <Text style={styles.slotType}>{appointment.type ?? 'Consulta'}</Text>
                    </View>
                    {renderAppointmentPeople(appointment)}
                  </View>
                ))
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderWeeklyView = () => (
    <View style={styles.weekList}>
      {weekDays.map(day => {
        const key = toDateKey(day);
        const dayAppointments = [...(appointmentsByDate[key] ?? [])].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        const isSelected = key === selectedDateKey;
        const isToday = key === todayKey;

        return (
          <Pressable
            key={key}
            onPress={() => setSelectedDate(day)}
            style={[styles.weekDayCard, isSelected && styles.weekDayCardSelected]}
            accessibilityRole="button"
          >
            <View style={styles.weekDayHeader}>
              <View>
                <Text style={[styles.weekDayName, isSelected && styles.selectedDarkText]}>
                  {WEEK_DAYS[day.getDay()]}
                </Text>
                <Text style={[styles.weekDayDate, isSelected && styles.selectedDarkText]}>
                  {formatShortDay(day)}
                </Text>
              </View>
              <Text style={[styles.weekCount, isSelected && styles.weekCountSelected]}>
                {dayAppointments.length}
              </Text>
            </View>
            {isToday ? <Text style={[styles.todayLabel, isSelected && styles.selectedDarkText]}>Hoje</Text> : null}
            {dayAppointments.slice(0, 2).map(appointment => (
              <Text key={appointment.id} style={[styles.weekAppointmentText, isSelected && styles.selectedDarkText]}>
                {formatTime(new Date(appointment.scheduledAt))} · {appointment.patientName ?? appointment.nutritionistName ?? 'Consulta'}
              </Text>
            ))}
            {dayAppointments.length > 2 ? (
              <Text style={[styles.moreText, isSelected && styles.selectedDarkText]}>
                +{dayAppointments.length - 2} consulta{dayAppointments.length - 2 > 1 ? 's' : ''}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  const renderMonthlyView = () => (
    <View style={styles.calendarCard}>
      <View style={styles.weekRow}>
        {WEEK_DAYS.map(day => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.daysGrid}>
        {calendarDays.map((date, index) => {
          const key = date ? toDateKey(date) : `empty-${index}`;
          const dayAppointments = date ? appointmentsByDate[key] ?? [] : [];
          const isSelected = key === selectedDateKey;
          const isToday = key === todayKey;

          return (
            <Pressable
              key={key}
              disabled={!date}
              onPress={() => date && setSelectedDate(date)}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
                !date && styles.dayCellEmpty,
              ]}
              accessibilityRole={date ? 'button' : undefined}
            >
              {date ? (
                <>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {date.getDate()}
                  </Text>
                  {dayAppointments.length > 0 ? (
                    <View style={[styles.dayDot, isSelected && styles.dayDotSelected]} />
                  ) : null}
                </>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderScheduleMode = () => {
    if (!hasAdvancedModes || mode === 'month') return renderMonthlyView();
    if (mode === 'week') return renderWeeklyView();
    return renderDailyView();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.sub}>
          {isAdmin ? 'Horários dos médicos e consultas atuais' : 'Próximas consultas'}
        </Text>

        {isLoading && (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        )}

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        {!isLoading && !error && (
          <>
            {hasAdvancedModes ? (
              <View style={styles.segmented}>
                {MODE_OPTIONS.map(option => {
                  const selected = mode === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => selectMode(option.value)}
                      style={[styles.segmentButton, selected && styles.segmentButtonSelected]}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.periodHeader}>
              <Pressable onPress={() => movePeriod(-1)} style={styles.monthButton} accessibilityRole="button">
                <ChevronLeft size={20} color={colors.text} />
              </Pressable>
              <Text style={styles.periodTitle}>{getPeriodTitle(hasAdvancedModes ? mode : 'month', selectedDate)}</Text>
              <Pressable onPress={() => movePeriod(1)} style={styles.monthButton} accessibilityRole="button">
                <ChevronRight size={20} color={colors.text} />
              </Pressable>
            </View>

            {renderScheduleMode()}
          </>
        )}

        {!isLoading && !error && hasAdvancedModes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Consulta atual</Text>
              <Text style={styles.sectionCount}>{currentAppointments.length}</Text>
            </View>
            {currentAppointments.length === 0 ? (
              <Text style={styles.emptyText}>
                {isAdmin ? 'Nenhum médico em consulta agora' : 'Nenhuma consulta em andamento agora'}
              </Text>
            ) : (
              currentAppointments.map(appointment => (
                <View key={appointment.id} style={styles.currentCard}>
                  <View style={styles.currentTimeBadge}>
                    <Clock size={14} color={colors.warning} />
                    <Text style={styles.currentTimeText}>{formatTime(new Date(appointment.scheduledAt))}</Text>
                  </View>
                  <View style={styles.currentInfo}>{renderAppointmentPeople(appointment)}</View>
                </View>
              ))
            )}
          </View>
        )}

        {!isLoading && !error && (!hasAdvancedModes || mode !== 'day') && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Horários do dia</Text>
                <Text style={styles.selectedDate}>{formatSelectedDate(selectedDate)}</Text>
              </View>
              <Text style={styles.sectionCount}>{selectedAppointments.length}</Text>
            </View>

            {selectedAppointments.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma consulta agendada para este dia</Text>
            ) : (
              selectedAppointments.map(a => (
                <AppointmentCard
                  key={a.id}
                  scheduledAt={a.scheduledAt}
                  status={a.status}
                  type={a.type ?? undefined}
                  patientName={a.patientName}
                  nutritionistName={a.nutritionistName}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
  loader: { marginTop: spacing.xl },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center', marginTop: spacing.lg },
  emptyText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.lg },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonSelected: { backgroundColor: colors.primary },
  segmentText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '800' },
  segmentTextSelected: { color: colors.onPrimary },
  periodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadow.sm,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceHigh,
  },
  periodTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800', textTransform: 'capitalize', flex: 1, textAlign: 'center' },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    ...shadow.sm,
  },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, color: colors.muted, fontSize: fontSize.xs, fontWeight: '700', textAlign: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    gap: 3,
  },
  dayCellSelected: { backgroundColor: colors.primary },
  dayCellToday: { borderWidth: 1, borderColor: colors.primary },
  dayCellEmpty: { opacity: 0 },
  dayText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '700' },
  dayTextSelected: { color: colors.onPrimary },
  dayDot: { width: 5, height: 5, borderRadius: radius.full, backgroundColor: colors.primary },
  dayDotSelected: { backgroundColor: colors.onPrimary },
  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    ...shadow.sm,
  },
  timelineRow: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.md },
  hourLabel: { width: 50, color: colors.muted, fontSize: fontSize.sm, fontWeight: '800', paddingTop: spacing.sm },
  hourSlot: {
    flex: 1,
    minHeight: 50,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
    gap: spacing.sm,
  },
  freeText: { color: colors.muted, fontSize: fontSize.sm, paddingTop: spacing.sm },
  slotAppointment: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '44',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  slotTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  slotType: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700', flex: 1, textAlign: 'right' },
  weekList: { gap: spacing.sm },
  weekDayCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  weekDayCardSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  weekDayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekDayName: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  weekDayDate: { color: colors.muted, fontSize: fontSize.xs, textTransform: 'capitalize' },
  selectedDarkText: { color: colors.onPrimary },
  weekCount: {
    minWidth: 28,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.primaryGlow,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 2,
  },
  weekCountSelected: { backgroundColor: colors.onPrimary, color: colors.primary },
  todayLabel: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '900' },
  weekAppointmentText: { color: colors.textSecondary, fontSize: fontSize.sm },
  moreText: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  selectedDate: { color: colors.muted, fontSize: fontSize.xs, textTransform: 'capitalize' },
  sectionCount: {
    minWidth: 30,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    overflow: 'hidden',
    backgroundColor: colors.primaryGlow,
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
  },
  currentCard: {
    backgroundColor: colors.warning + '12',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning + '33',
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  currentTimeBadge: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.warning + '20',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  currentTimeText: { color: colors.warning, fontSize: fontSize.sm, fontWeight: '800' },
  currentInfo: { flex: 1 },
  compactPeople: { gap: spacing.xs },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  personText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
});
