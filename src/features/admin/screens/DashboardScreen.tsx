import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Stethoscope, Calendar } from 'lucide-react-native';
import { StatCard } from '@/shared/components/ui/StatCard';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

export function AdminDashboardScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Painel Admin</Text>

        <View style={styles.statsRow}>
          <StatCard label="Pacientes" value={48} Icon={Users} />
          <StatCard label="Nutricionistas" value={6} Icon={Stethoscope} color={colors.success} />
        </View>
        <StatCard label="Consultas Hoje" value={14} Icon={Calendar} color={colors.warning} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pendências</Text>
          <View style={styles.pendingCard}>
            <Text style={styles.pendingNum}>2</Text>
            <Text style={styles.pendingLabel}>nutricionistas aguardando aprovação</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  pendingCard: {
    backgroundColor: colors.warning + '22',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '55',
  },
  pendingNum: { color: colors.warning, fontSize: 40, fontWeight: '800' },
  pendingLabel: { color: colors.text, fontSize: fontSize.md, flex: 1 },
});
