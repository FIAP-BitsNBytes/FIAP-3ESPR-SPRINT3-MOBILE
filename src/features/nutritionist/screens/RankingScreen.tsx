import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy } from 'lucide-react-native';
import { PatientCard } from '@/shared/components/ui/PatientCard';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

const RANKING = [
  { id: '1', name: 'Mariana Costa', level: 4, streakDays: 21, points: 1200 },
  { id: '2', name: 'Ana Souza', level: 1, streakDays: 12, points: 640 },
  { id: '3', name: 'Carlos Silva', level: 2, streakDays: 5, points: 380 },
  { id: '4', name: 'Pedro Lima', level: 3, streakDays: 0, points: 200 },
];

const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

export function NutritionistRankingScreen() {
  const top3 = RANKING.slice(0, 3);
  const rest = RANKING.slice(3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ranking</Text>

        <View style={styles.podium}>
          {top3.map((p, i) => (
            <View key={p.id} style={[styles.podiumItem, i === 0 && styles.podiumFirst]}>
              <Trophy size={i === 0 ? 28 : 20} color={PODIUM_COLORS[i]} />
              <Text style={[styles.podiumPos, { color: PODIUM_COLORS[i] }]}>#{i + 1}</Text>
              <Text style={styles.podiumName} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
              <Text style={styles.podiumPoints}>{p.points}pts</Text>
            </View>
          ))}
        </View>

        <View style={styles.list}>
          {rest.map((p, i) => (
            <View key={p.id} style={styles.rankRow}>
              <Text style={styles.rankNum}>#{i + 4}</Text>
              <PatientCard {...p} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  podium: { flexDirection: 'row', gap: spacing.sm },
  podiumItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  podiumFirst: { borderWidth: 2, borderColor: '#FFD700' },
  podiumPos: { fontSize: fontSize.lg, fontWeight: '800' },
  podiumName: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  podiumPoints: { color: colors.muted, fontSize: fontSize.xs },
  list: { gap: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rankNum: { color: colors.muted, fontSize: fontSize.md, fontWeight: '700', width: 32 },
});
