import { StyleSheet, Text, View } from 'react-native';
import { Stethoscope, User } from 'lucide-react-native';
import { colors, fontSize, spacing } from '@/shared/theme';
import { AppointmentItem } from '../../hooks/useAppointments';

interface AppointmentPeopleProps {
  appointment: AppointmentItem;
}

export function AppointmentPeople({ appointment }: AppointmentPeopleProps) {
  return (
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
}

const styles = StyleSheet.create({
  compactPeople: { gap: spacing.xs },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  personText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700', flex: 1 },
});
