import { ActivityIndicator, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontSize, spacing } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';
import { useScheduleView } from '../hooks/useScheduleView';
import { DAY_HOURS, getPeriodTitle } from '../utils/scheduleDate';
import {
  CurrentAppointmentsSection,
  DailyAppointmentsSection,
  DailyScheduleView,
  MonthlyScheduleView,
  ScheduleHeader,
  WeeklyScheduleView,
} from '../components/schedule';

export function ScheduleScreen() {
  const { user } = useAuthContext();
  const role = user?.role ?? 'PATIENT';

  const {
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
  } = useScheduleView(role);

  const renderScheduleMode = () => {
    if (!hasAdvancedModes || mode === 'month') {
      return (
        <MonthlyScheduleView
          calendarDays={calendarDays}
          appointmentsByDate={appointmentsByDate}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
          onSelectDate={setSelectedDate}
        />
      );
    }

    if (mode === 'week') {
      return (
        <WeeklyScheduleView
          weekDays={weekDays}
          appointmentsByDate={appointmentsByDate}
          selectedDateKey={selectedDateKey}
          todayKey={todayKey}
          onSelectDate={setSelectedDate}
        />
      );
    }

    return <DailyScheduleView hours={DAY_HOURS} appointments={selectedAppointments} />;
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
            <ScheduleHeader
              mode={mode}
              hasAdvancedModes={hasAdvancedModes}
              onSelectMode={selectMode}
              periodTitle={getPeriodTitle(hasAdvancedModes ? mode : 'month', selectedDate)}
              onPrev={() => movePeriod(-1)}
              onNext={() => movePeriod(1)}
            />

            {renderScheduleMode()}
          </>
        )}

        {!isLoading && !error && hasAdvancedModes && (
          <CurrentAppointmentsSection appointments={currentAppointments} isAdmin={isAdmin} />
        )}

        {!isLoading && !error && (!hasAdvancedModes || mode !== 'day') && (
          <DailyAppointmentsSection selectedDate={selectedDate} appointments={selectedAppointments} />
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
});
