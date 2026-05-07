import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Users, Calendar, AlertTriangle } from 'lucide-react-native';
import { StatCard } from '@/shared/components/ui/StatCard';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';
import { useClinicPatients } from '../hooks/useClinicPatients';

export function NutritionistHomeScreen() {
  const { user } = useAuthContext();
  const { totalCount, lowEngagement, isLoading, error } = useClinicPatients();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]}</Text>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Acompanhe seus pacientes em tempo real</Text>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Pacientes" value={totalCount} Icon={Users} color={colors.primary} />
          <StatCard label="Alertas" value={lowEngagement.length} Icon={AlertTriangle} color={colors.warning} />
          <StatCard label="Agenda" value="—" Icon={Calendar} color={colors.success} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Engajamento Baixo</Text>
              <Text style={styles.sectionSub}>Pacientes precisando de atenção</Text>
            </View>
            {lowEngagement.length > 0 && (
              <View style={styles.alertBadge}>
                <Text style={styles.alertCount}>{lowEngagement.length}</Text>
              </View>
            )}
          </View>

          {isLoading && <ActivityIndicator color={colors.primary} />}

          {error && <Text style={styles.errorText}>{error}</Text>}

          {!isLoading && !error && lowEngagement.length === 0 && (
            <Text style={styles.emptyText}>Todos os pacientes estão engajados</Text>
          )}

          {!isLoading && lowEngagement.length > 0 && (
            <View style={styles.listCard}>
              {lowEngagement.map((p, i) => (
                <View key={p.id}>
                  <PatientCard
                    name={p.name}
                    level={p.level}
                    streakDays={p.streakDays}
                    points={p.points}
                  />
                  {i < lowEngagement.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: 2 },
  greeting: { color: colors.muted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: fontSize.sm, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  sectionSub: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  alertBadge: {
    backgroundColor: colors.warning + '22',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.warning + '44',
  },
  alertCount: { color: colors.warning, fontWeight: '800', fontSize: fontSize.sm },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  errorText: { color: colors.danger, fontSize: fontSize.sm },
  emptyText: { color: colors.muted, fontSize: fontSize.sm },
});
