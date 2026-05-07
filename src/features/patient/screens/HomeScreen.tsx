import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Plus, TrendingUp, Droplets, Beef } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { StatCard } from '@/shared/components/ui/StatCard';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';
import { useGamification } from '@/shared/hooks/useGamification';
import { useTodayLogs } from '../hooks/useTodayLogs';

function PrimaryButton({ label, icon: Icon, onPress }: { label: string; icon: typeof Plus; onPress?: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) }); }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.actionBtn, animStyle]}>
        <Icon size={20} color={colors.onPrimary} />
        <Text style={styles.actionText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function SecondaryButton({ label, icon: Icon, onPress }: { label: string; icon: typeof Plus; onPress?: () => void }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) }); }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.actionBtn, styles.actionSecondary, animStyle]}>
        <Icon size={20} color={colors.primary} />
        <Text style={[styles.actionText, { color: colors.primary }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const CALORIE_GOAL = 2000;

export function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { stats, isLoading: gamLoading } = useGamification();
  const { totalCalories, waterMl } = useTodayLogs();

  if (!user) return null;

  const kcalPct = Math.min(Math.round((totalCalories / CALORIE_GOAL) * 100), 100);
  const waterL = (waterMl / 1000).toFixed(1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LevelCard
          name={user.name}
          level={gamLoading ? 1 : stats.level}
          currentXP={gamLoading ? 0 : stats.experience % 500}
          maxXP={500}
          streakDays={gamLoading ? 0 : stats.streakDays}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoje</Text>
          <View style={styles.statsRow}>
            <StatCard label="Calorias" value={totalCalories} Icon={Plus} color={colors.primary} />
            <StatCard label="Água" value={`${waterL}L`} Icon={Droplets} color="#38BDF8" />
            <StatCard label="Pontos" value={gamLoading ? '—' : stats.points} Icon={Beef} color={colors.success} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meta Calórica</Text>
          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalPercent}>{kcalPct}%</Text>
              <Text style={styles.goalSub}>{totalCalories} / {CALORIE_GOAL.toLocaleString('pt-BR')} kcal</Text>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${kcalPct}%` as `${number}%` }]} />
            </View>
            <Text style={styles.goalLabel}>
              Faltam {Math.max(CALORIE_GOAL - totalCalories, 0).toLocaleString('pt-BR')} kcal para a meta diária
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton label="Registrar Refeição" icon={Plus} />
          <SecondaryButton label="Ver Evolução" icon={TrendingUp} onPress={() => router.push(`/(tabs)/progress?patientId=${user.id}`)} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  goalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  goalPercent: { color: colors.primary, fontSize: 42, fontWeight: '900', lineHeight: 46 },
  goalSub: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600', paddingBottom: 4 },
  goalTrack: {
    height: 8,
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  goalLabel: { color: colors.muted, fontSize: fontSize.sm },
  actions: { gap: spacing.sm },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    ...shadow.primary,
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
    shadowColor: 'transparent',
    elevation: 0,
  },
  actionText: { color: colors.onPrimary, fontSize: fontSize.md, fontWeight: '700' },
});
