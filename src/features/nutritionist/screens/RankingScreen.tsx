import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Crown, Medal } from 'lucide-react-native';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useGamificationRanking } from '../hooks/useGamificationRanking';

const PODIUM = [
  { color: '#FFD700', glow: 'rgba(255,215,0,0.18)', height: 110 },
  { color: '#C0C0C0', glow: 'rgba(192,192,192,0.14)', height: 82 },
  { color: '#CD7F32', glow: 'rgba(205,127,50,0.14)', height: 66 },
];

export function NutritionistRankingScreen() {
  const { ranking, isLoading, error } = useGamificationRanking(50);

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Ranking</Text>
          <Text style={styles.subtitle}>Melhores pacientes do mês</Text>
        </View>

        {top3.length === 0 && (
          <Text style={styles.emptyText}>Nenhum dado de ranking disponível</Text>
        )}

        {top3.length >= 3 && (
          <View style={styles.podiumArea}>
            {/* Render order: 2nd, 1st, 3rd for visual depth */}
            {[1, 0, 2].map(i => {
              const p = top3[i];
              const pod = PODIUM[i];
              const initials = p.patientName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
              const isFirst = i === 0;
              return (
                <View key={p.patientId} style={[styles.podiumCol, isFirst && styles.podiumColFirst]}>
                  {isFirst && <Crown size={24} color={pod.color} style={styles.crown} />}
                  <View style={[styles.podiumAvatar, { borderColor: pod.color, backgroundColor: pod.glow }]}>
                    <Text style={[styles.podiumInitials, { color: pod.color }]}>{initials}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{p.patientName.split(' ')[0]}</Text>
                  <Text style={[styles.podiumPoints, { color: pod.color }]}>{p.points}pts</Text>
                  <View style={[styles.podiumBlock, { height: pod.height, backgroundColor: pod.glow, borderTopColor: pod.color }]}>
                    <Text style={[styles.podiumPos, { color: pod.color }]}>#{i + 1}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {rest.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Demais posições</Text>
            <View style={styles.listCard}>
              {rest.map((p, i) => (
                <View key={p.patientId}>
                  <View style={styles.rankRow}>
                    <Medal size={16} color={colors.muted} />
                    <Text style={styles.rankNum}>#{i + 4}</Text>
                    <View style={styles.rankCard}>
                      <PatientCard
                        name={p.patientName}
                        level={p.level}
                        streakDays={p.streakDays}
                        points={p.points}
                      />
                    </View>
                  </View>
                  {i < rest.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: 2 },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: fontSize.sm },
  podiumArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  podiumCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  podiumColFirst: { marginBottom: 0 },
  crown: { marginBottom: spacing.xs },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  podiumInitials: { fontWeight: '800', fontSize: fontSize.md },
  podiumName: { color: colors.text, fontSize: fontSize.xs, fontWeight: '600', textAlign: 'center' },
  podiumPoints: { fontSize: fontSize.xs, fontWeight: '700' },
  podiumBlock: {
    width: '100%',
    borderRadius: radius.md,
    borderTopWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  podiumPos: { fontWeight: '900', fontSize: fontSize.lg },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingLeft: spacing.md,
  },
  rankNum: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '700', width: 24 },
  rankCard: { flex: 1 },
  divider: { height: 1, backgroundColor: colors.border },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
});
