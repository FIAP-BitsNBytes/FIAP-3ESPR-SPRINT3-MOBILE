import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { AppointmentCard } from '@/shared/components/ui/AppointmentCard';
import { AppointmentItem } from '../../hooks/useAppointments';
import { formatSelectedDate } from '../../utils/scheduleDate';

interface DailyAppointmentsSectionProps {
  selectedDate: Date;
  appointments: AppointmentItem[];
}

export function DailyAppointmentsSection({ selectedDate, appointments }: DailyAppointmentsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Horários do dia</Text>
          <Text style={styles.selectedDate}>{formatSelectedDate(selectedDate)}</Text>
        </View>
        <Text style={styles.sectionCount}>{appointments.length}</Text>
      </View>

      {appointments.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma consulta agendada para este dia</Text>
      ) : (
        appointments.map(a => (
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
  );
}

const styles = StyleSheet.create({
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
  emptyText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center', paddingVertical: spacing.lg },
});
