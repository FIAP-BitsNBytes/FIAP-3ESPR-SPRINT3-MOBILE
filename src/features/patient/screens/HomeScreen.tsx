import { useMemo, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Flame, TrendingUp, Droplets, Trophy } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { StatCard } from '@/shared/components/ui/StatCard';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';
import { useGamification } from '@/shared/hooks/useGamification';
import { MEAL_TIME_ORDER } from '@/features/nutrition';
import { useTodayLogs } from '../hooks/useTodayLogs';
import { useDailyPlan, type PlanItem } from '../hooks/useDailyPlan';
import { useLogMeal, type LogFreeMealParams } from '../hooks/useLogMeal';
import { useLogWater } from '../hooks/useLogWater';
import { useAppointments } from '@/features/calendar/hooks/useAppointments';
import { FreeMealModal } from '../components/nutrition';
import { QuickActions, NextMealCard, NextAppointmentCard } from '../components/home';

const CALORIE_GOAL = 2000;
const WATER_GOAL_ML = 2000;
const QUICK_WATER_ML = 250;

const isUnlogged = (item: PlanItem): boolean => !item.logId || item.logId === 'pending';

export function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { stats, isLoading: gamLoading } = useGamification();
  const { totalCalories, waterMl } = useTodayLogs();
  const { planItems } = useDailyPlan();
  const { logFreeMeal, isLogging: isMealLogging } = useLogMeal();
  const { logWater, isLogging: isWaterLogging } = useLogWater();
  const { appointments } = useAppointments();

  const [showFreeMeal, setShowFreeMeal] = useState(false);

  // Próxima refeição pendente do plano, na ordem natural das refeições.
  const nextMeal = useMemo(() => {
    const sorted = [...planItems].sort((a, b) => {
      const order = MEAL_TIME_ORDER.indexOf(a.mealTime) - MEAL_TIME_ORDER.indexOf(b.mealTime);
      return order !== 0 ? order : a.sequence - b.sequence;
    });
    return sorted.find(isUnlogged) ?? null;
  }, [planItems]);

  // Próxima consulta futura não cancelada (appointments vem em ordem asc).
  const nextAppointment = useMemo(() => {
    const now = Date.now();
    return appointments.find(a => a.status !== 'CANCELLED' && new Date(a.scheduledAt).getTime() >= now) ?? null;
  }, [appointments]);

  if (!user) return null;

  const kcalPct = Math.min(Math.round((totalCalories / CALORIE_GOAL) * 100), 100);
  const waterPct = Math.min(Math.round((waterMl / WATER_GOAL_ML) * 100), 100);
  const waterL = (waterMl / 1000).toFixed(1);

  const handleAddWater = async () => {
    const result = await logWater(QUICK_WATER_ML);
    if (!result.success) Alert.alert('Erro', result.error);
  };

  const handleFreeMeal = async (params: LogFreeMealParams) => {
    const result = await logFreeMeal(params);
    setShowFreeMeal(false);
    if (!result.success) Alert.alert('Erro', result.error);
  };

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
          <Text style={styles.sectionTitle}>Ações rápidas</Text>
          <QuickActions
            onRegisterMeal={() => setShowFreeMeal(true)}
            onAddWater={handleAddWater}
            onOpenPlan={() => router.push('/(tabs)/nutrition')}
            onOpenSchedule={() => router.push('/(tabs)/schedule')}
            waterLoading={isWaterLogging}
          />
        </View>

        <NextMealCard
          nextItem={nextMeal}
          hasPlan={planItems.length > 0}
          onPress={() => router.push('/(tabs)/nutrition')}
        />

        <NextAppointmentCard
          appointment={nextAppointment}
          onPress={() => router.push('/(tabs)/schedule')}
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hoje</Text>
          <View style={styles.statsRow}>
            <StatCard label="Calorias" value={totalCalories} Icon={Flame} color={colors.primary} />
            <StatCard label="Água" value={`${waterL}L`} Icon={Droplets} color={colors.waterAccent} />
            <StatCard label="Pontos" value={gamLoading ? '—' : stats.points} Icon={Trophy} color={colors.success} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metas do dia</Text>

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

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={[styles.goalPercent, { color: colors.waterAccent }]}>{waterPct}%</Text>
              <Text style={styles.goalSub}>{waterMl} / {WATER_GOAL_ML.toLocaleString('pt-BR')} ml</Text>
            </View>
            <View style={styles.goalTrack}>
              <View style={[styles.goalFill, { width: `${waterPct}%` as `${number}%`, backgroundColor: colors.waterAccent }]} />
            </View>
            <Text style={styles.goalLabel}>
              Faltam {Math.max(WATER_GOAL_ML - waterMl, 0).toLocaleString('pt-BR')} ml para a meta de hidratação
            </Text>
          </View>
        </View>

        <SecondaryButton label="Ver Evolução" icon={TrendingUp} onPress={() => router.push(`/(tabs)/progress?patientId=${user.id}`)} />
      </ScrollView>

      <FreeMealModal
        visible={showFreeMeal}
        onClose={() => setShowFreeMeal(false)}
        onSubmit={handleFreeMeal}
        isLogging={isMealLogging}
      />
    </SafeAreaView>
  );
}

function SecondaryButton({ label, icon: Icon, onPress }: { label: string; icon: typeof TrendingUp; onPress?: () => void }) {
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
