import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppointmentCard } from '@/shared/components/ui/AppointmentCard';
import { colors, spacing, fontSize } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';

const NUTRITIONIST_APPOINTMENTS = [
  { id: '1', patientName: 'Ana Souza', scheduledAt: '2026-05-07T10:00:00', status: 'CONFIRMED' as const, type: 'Consulta inicial' },
  { id: '2', patientName: 'Carlos Silva', scheduledAt: '2026-05-07T14:00:00', status: 'PENDING' as const, type: 'Retorno' },
  { id: '3', patientName: 'Pedro Lima', scheduledAt: '2026-05-08T09:00:00', status: 'CONFIRMED' as const, type: 'Avaliação' },
];

const PATIENT_APPOINTMENTS = [
  { id: '1', nutritionistName: 'Dra. Fernanda Ramos', scheduledAt: '2026-05-07T10:00:00', status: 'CONFIRMED' as const, type: 'Consulta inicial' },
  { id: '2', nutritionistName: 'Dra. Fernanda Ramos', scheduledAt: '2026-05-14T10:00:00', status: 'PENDING' as const, type: 'Retorno' },
];

export function ScheduleScreen() {
  const { user } = useAuthContext();
  const appointments = user?.role === 'PATIENT' ? PATIENT_APPOINTMENTS : NUTRITIONIST_APPOINTMENTS;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Agenda</Text>
        <Text style={styles.sub}>Próximas consultas</Text>
        {appointments.map(a => <AppointmentCard key={a.id} {...a} />)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  sub: { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
});
