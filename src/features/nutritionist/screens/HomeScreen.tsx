import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Calendar, AlertTriangle } from 'lucide-react-native';
import { StatCard } from '@/shared/components/ui/StatCard';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, fontSize } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';

const LOW_ENGAGEMENT = [
  { id: '1', name: 'Carlos Silva', level: 2, streakDays: 0, points: 80 },
  { id: '2', name: 'Ana Souza', level: 1, streakDays: 1, points: 40 },
  { id: '3', name: 'Pedro Lima', level: 3, streakDays: 0, points: 200 },
];

export function NutritionistHomeScreen() {
  const { user } = useAuthContext();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]}</Text>
        <Text style={styles.title}>Dashboard</Text>

        <View style={styles.statsRow}>
          <StatCard label="Pacientes" value={12} Icon={Users} />
          <StatCard label="Hoje" value={3} Icon={Calendar} color={colors.success} />
          <StatCard label="Alertas" value={3} Icon={AlertTriangle} color={colors.warning} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engajamento Baixo</Text>
          <Text style={styles.sectionSub}>Pacientes sem streak ativo</Text>
          {LOW_ENGAGEMENT.map(p => <PatientCard key={p.id} {...p} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  greeting: { color: colors.muted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800', marginTop: -spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  sectionSub: { color: colors.muted, fontSize: fontSize.sm, marginTop: -spacing.sm },
});
