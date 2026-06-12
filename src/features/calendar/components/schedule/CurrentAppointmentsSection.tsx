import { StyleSheet, Text, View } from 'react-native';
import { Clock } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { AppointmentItem } from '../../hooks/useAppointments';
import { formatTime } from '../../utils/scheduleDate';
import { AppointmentPeople } from './AppointmentPeople';
import { sharedScheduleStyles } from './scheduleStyles';

interface CurrentAppointmentsSectionProps {
  appointments: AppointmentItem[];
  isAdmin: boolean;
}

export function CurrentAppointmentsSection({ appointments, isAdmin }: CurrentAppointmentsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Consulta atual</Text>
        <Text style={styles.sectionCount}>{appointments.length}</Text>
      </View>
      {appointments.length === 0 ? (
        <Text style={styles.emptyText}>
          {isAdmin ? 'Nenhum médico em consulta agora' : 'Nenhuma consulta em andamento agora'}
        </Text>
      ) : (
        appointments.map(appointment => (
          <View key={appointment.id} style={styles.currentCard}>
            <View style={sharedScheduleStyles.currentTimeBadge}>
              <Clock size={14} color={colors.warning} />
              <Text style={sharedScheduleStyles.currentTimeText}>{formatTime(new Date(appointment.scheduledAt))}</Text>
            </View>
            <View style={styles.currentInfo}><AppointmentPeople appointment={appointment} /></View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
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
  currentInfo: { flex: 1 },
});
