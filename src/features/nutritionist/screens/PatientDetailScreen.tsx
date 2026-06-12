import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Flame, Target, TrendingUp, Trophy, Utensils } from 'lucide-react-native';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { StatCard } from '@/shared/components/ui/StatCard';
import { appStyles, colors, fontSize, spacing } from '@/shared/theme';
import { useGamification } from '@/shared/hooks/useGamification';
import { useTodayLogs } from '@/features/patient/hooks/useTodayLogs';
import { DailyProgressItem, useProgressMetrics } from '@/features/patient/hooks/useProgressMetrics';
import { usePlanDetail } from '@/features/nutrition/hooks/usePlanDetail';
import { useDeviceStatus } from '../hooks/useDeviceStatus';
import {
  InsightCard,
  MealPlanEntryCard,
  PatientDetailHeader,
  TodayGoalsSection,
  WeeklyChartsSection,
} from '../components/patient-detail';

const CALORIE_FALLBACK = 2000;
const WATER_GOAL_ML = 2500;
const MEAL_FALLBACK = 4;
const STREAK_GOAL = 7;

export function NutritionistPatientDetailScreen() {
  const router = useRouter();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name: string }>();

  const { stats, isLoading: isGamificationLoading } = useGamification(patientId ?? null);
  const { totalCalories, waterMl, meals } = useTodayLogs(patientId ?? null);
  const { days, isLoading: isProgressLoading, error } = useProgressMetrics(patientId ?? null);
  const { plan, items: planItems, isLoading: isPlanLoading } = usePlanDetail(patientId ?? null);
  const { isOnline: isBottleOnline } = useDeviceStatus(patientId ?? null);

  const today = new Date().toISOString().slice(0, 10);
  const mealCount = meals.filter(m => m.category === 'MEAL').length;
  const xpInLevel = stats.experience % 500;
  const patientName = name ?? 'Paciente';

  const goToMealPlan = () => router.push(`/meal-plan?patientId=${patientId}&name=${encodeURIComponent(patientName)}`);

  // Dynamic goals derived from the active meal plan
  const planCalorieGoal = planItems.reduce((s, i) => s + (i.prescribedCal ?? 0), 0);
  const calorieGoal = planCalorieGoal > 0 ? planCalorieGoal : CALORIE_FALLBACK;
  const todayLoggedCount = planItems.filter(i => i.logId && i.logId !== 'pending').length;
  const planAdherencePct = planItems.length > 0
    ? Math.round((todayLoggedCount / planItems.length) * 100)
    : null;
  const mealGoal = planItems.length > 0 ? planItems.length : MEAL_FALLBACK;

  const weeklyAverage = useMemo(() => {
    const total = days.reduce((sum, d) => sum + d.calories, 0);
    return Math.round(total / Math.max(days.length, 1));
  }, [days]);

  const weeklyCalTotal = useMemo(
    () => days.reduce((s, d) => s + d.calories, 0),
    [days],
  );

  const bestDay = useMemo(
    () => days.reduce<DailyProgressItem | null>(
      (best, d) => (!best || d.calories > best.calories ? d : best), null,
    ),
    [days],
  );

  const insightText = useMemo(() => {
    if (totalCalories >= calorieGoal)
      return `Meta calórica de hoje atingida (${totalCalories.toLocaleString('pt-BR')} kcal).`;
    const deficit = calorieGoal - totalCalories;
    return `Faltam ${deficit.toLocaleString('pt-BR')} kcal para a meta de hoje (${Math.round((totalCalories / calorieGoal) * 100)}% concluído).`;
  }, [totalCalories, calorieGoal]);

  const insightMeta = useMemo(() => {
    const parts: string[] = [];
    const weeklyPct = Math.round((weeklyCalTotal / (calorieGoal * 7)) * 100);
    if (weeklyCalTotal > 0) parts.push(`Semana: ${weeklyPct}% da meta calórica.`);
    if (bestDay?.calories) parts.push(`Melhor dia: ${bestDay.dayLabel} (${bestDay.calories.toLocaleString('pt-BR')} kcal).`);
    if (planAdherencePct !== null) {
      const pending = planItems.length - todayLoggedCount;
      if (pending > 0) parts.push(`${pending} item${pending !== 1 ? 's' : ''} do plano pendente${pending !== 1 ? 's' : ''} hoje.`);
      else parts.push('Todas as refeições do plano registradas hoje.');
    }
    return parts.join(' ');
  }, [weeklyCalTotal, calorieGoal, bestDay, planAdherencePct, planItems.length, todayLoggedCount]);

  const adherenceColor = planAdherencePct == null ? colors.muted
    : planAdherencePct >= 80 ? colors.success
    : planAdherencePct >= 50 ? colors.warning
    : colors.danger;

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <PatientDetailHeader
        patientName={patientName}
        onBack={() => router.back()}
        onOpenMealPlan={goToMealPlan}
        isBottleOnline={isBottleOnline}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LevelCard
          name={patientName}
          level={isGamificationLoading ? 1 : stats.level}
          currentXP={isGamificationLoading ? 0 : xpInLevel}
          maxXP={500}
          streakDays={isGamificationLoading ? 0 : stats.streakDays}
        />

        <MealPlanEntryCard
          plan={plan}
          planItems={planItems}
          isPlanLoading={isPlanLoading}
          planAdherencePct={planAdherencePct}
          onPress={goToMealPlan}
        />

        {/* Stat cards */}
        <View style={styles.statsRow}>
          <StatCard label="Média semanal" value={`${weeklyAverage} kcal`} Icon={TrendingUp} color={colors.primary} />
          <StatCard label="Sequência" value={`${stats.streakDays}d`} Icon={Flame} color={colors.warning} />
        </View>
        <View style={styles.statsRow}>
          <StatCard label="Refeições hoje" value={mealCount} Icon={Utensils} color={colors.success} />
          {planAdherencePct !== null
            ? <StatCard label="Adesão ao plano" value={`${planAdherencePct}%`} Icon={Target} color={adherenceColor} />
            : <StatCard label="XP total" value={stats.experience} Icon={Trophy} color="#A78BFA" />
          }
        </View>

        <TodayGoalsSection
          totalCalories={totalCalories}
          calorieGoal={calorieGoal}
          waterMl={waterMl}
          waterGoalMl={WATER_GOAL_ML}
          mealValue={planItems.length > 0 ? todayLoggedCount : mealCount}
          mealGoal={mealGoal}
          mealUnit={planItems.length > 0 ? 'itens' : 'reg.'}
          streakDays={stats.streakDays}
          streakGoal={STREAK_GOAL}
        />

        {isProgressLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <WeeklyChartsSection
          days={days}
          calorieGoal={calorieGoal}
          waterGoalMl={WATER_GOAL_ML}
          today={today}
        />

        <InsightCard insightText={insightText} insightMeta={insightMeta} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: 120 },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
});
