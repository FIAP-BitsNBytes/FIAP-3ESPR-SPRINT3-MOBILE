import { ScrollView, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Star, Zap, Flame } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useGamificationRanking, type RankingEntry } from '../hooks/useGamificationRanking';

const MEDALS = ['🏆', '🥈', '🥉'];

const PODIUM_STYLE = [
  { color: '#FFD700', glow: 'rgba(255,215,0,0.18)', height: 110 },
  { color: '#C0C0C0', glow: 'rgba(192,192,192,0.14)', height: 82 },
  { color: '#CD7F32', glow: 'rgba(205,127,50,0.14)', height: 66 },
];

function initials(name: string) {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function FeaturedRow({ entry }: { entry: RankingEntry }) {
  return (
    <View style={styles.featuredRow}>
      <View style={styles.featuredRank}>
        <Text style={styles.featuredRankNum}>#{entry.clinicRank}</Text>
      </View>
      <View style={styles.featuredAvatar}>
        <Text style={styles.featuredInitials}>{initials(entry.patientName)}</Text>
      </View>
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredName} numberOfLines={1}>{entry.patientName}</Text>
        <View style={styles.featuredChips}>
          <View style={styles.chip}>
            <Star size={9} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>Lv {entry.level}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#A78BFA22' }]}>
            <Zap size={9} color="#A78BFA" />
            <Text style={[styles.chipText, { color: '#A78BFA' }]}>{entry.experience} xp</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.warning + '22' }]}>
            <Flame size={9} color={colors.warning} />
            <Text style={[styles.chipText, { color: colors.warning }]}>{entry.streakDays}d</Text>
          </View>
        </View>
      </View>
      <Text style={styles.featuredPoints}>{entry.points} pts</Text>
    </View>
  );
}

function ListRow({ entry, isLast }: { entry: RankingEntry; isLast: boolean }) {
  return (
    <>
      <View style={styles.listRow}>
        <Text style={styles.listRankNum}>#{entry.clinicRank}</Text>
        <View style={styles.listAvatar}>
          <Text style={styles.listInitials}>{initials(entry.patientName)}</Text>
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={1}>{entry.patientName}</Text>
          <Text style={styles.listSub}>Lv {entry.level} · {entry.experience} xp</Text>
        </View>
        <Text style={styles.listPoints}>{entry.points} pts</Text>
      </View>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export function NutritionistRankingScreen() {
  const { ranking, isLoading, error } = useGamificationRanking(10);

  const podiumCount = Math.min(ranking.length, 3);
  const top3 = ranking.slice(0, podiumCount);
  const next2 = ranking.slice(3, 5);
  const rest = ranking.slice(5);

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
          <Text style={styles.subtitle}>Top 10 pacientes da clínica</Text>
        </View>

        {ranking.length === 0 && (
          <Text style={styles.emptyText}>Nenhum dado de ranking disponível</Text>
        )}

        {/* Podium — 1, 2 or 3 players */}
        {podiumCount > 0 && (
          <View style={styles.podiumArea}>
            {(podiumCount === 3 ? [1, 0, 2] : Array.from({ length: podiumCount }, (_, i) => i)).map(i => {
              const p = top3[i];
              const pod = PODIUM_STYLE[i];
              return (
                <View key={p.patientId} style={[styles.podiumCol, i === 0 && styles.podiumColFirst]}>
                  <Text style={styles.podiumEmoji}>{MEDALS[i]}</Text>
                  <View style={[styles.podiumAvatar, { borderColor: pod.color, backgroundColor: pod.glow }]}>
                    <Text style={[styles.podiumInitials, { color: pod.color }]}>{initials(p.patientName)}</Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{p.patientName.split(' ')[0]}</Text>
                  <Text style={[styles.podiumXp, { color: pod.color }]}>{p.experience} xp</Text>
                  <View style={[styles.podiumBlock, { height: pod.height, backgroundColor: pod.glow, borderTopColor: pod.color }]}>
                    <Text style={[styles.podiumPos, { color: pod.color }]}>{i + 1}º</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Featured — positions 4 and 5 */}
        {next2.length > 0 && (
          <View style={styles.featuredCard}>
            {next2.map((entry, i) => (
              <View key={entry.patientId}>
                <FeaturedRow entry={entry} />
                {i < next2.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}

        {/* List — positions 6–10 */}
        {rest.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Demais posições</Text>
            <View style={styles.listCard}>
              {rest.map((entry, i) => (
                <ListRow key={entry.patientId} entry={entry} isLast={i === rest.length - 1} />
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

  // Podium
  podiumArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  podiumCol: { flex: 1, alignItems: 'center', gap: spacing.xs },
  podiumColFirst: { marginBottom: 0 },
  podiumEmoji: { fontSize: 26, marginBottom: 2 },
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
  podiumXp: { fontSize: 10, fontWeight: '700' },
  podiumBlock: {
    width: '100%',
    borderRadius: radius.md,
    borderTopWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  podiumPos: { fontWeight: '900', fontSize: fontSize.lg },

  // Featured (4th and 5th)
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  featuredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  featuredRank: {
    width: 28,
    alignItems: 'center',
  },
  featuredRankNum: { color: colors.muted, fontSize: fontSize.sm, fontWeight: '800' },
  featuredAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primaryGlow,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredInitials: { color: colors.primary, fontWeight: '800', fontSize: fontSize.sm },
  featuredInfo: { flex: 1, gap: 4 },
  featuredName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  featuredChips: { flexDirection: 'row', gap: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.primaryGlow,
  },
  chipText: { fontSize: 9, fontWeight: '700', color: colors.primary },
  featuredPoints: { color: colors.text, fontSize: fontSize.sm, fontWeight: '800' },

  // List (6th–10th)
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
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  listRankNum: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '800', width: 24, textAlign: 'center' },
  listAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listInitials: { color: colors.muted, fontWeight: '700', fontSize: fontSize.xs },
  listInfo: { flex: 1 },
  listName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  listSub: { color: colors.muted, fontSize: 10 },
  listPoints: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '700' },

  divider: { height: 1, backgroundColor: colors.border },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
  emptyText: { color: colors.muted, fontSize: fontSize.sm, textAlign: 'center' },
});
