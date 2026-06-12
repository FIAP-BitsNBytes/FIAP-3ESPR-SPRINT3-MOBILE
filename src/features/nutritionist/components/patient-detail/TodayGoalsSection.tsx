import { StyleSheet, Text, View } from 'react-native';
import { appStyles, colors, radius, shadow, spacing } from '@/shared/theme';
import { GoalBar } from './GoalBar';

interface TodayGoalsSectionProps {
  totalCalories: number;
  calorieGoal: number;
  waterMl: number;
  waterGoalMl: number;
  mealValue: number;
  mealGoal: number;
  mealUnit: string;
  streakDays: number;
  streakGoal: number;
}

export function TodayGoalsSection({
  totalCalories,
  calorieGoal,
  waterMl,
  waterGoalMl,
  mealValue,
  mealGoal,
  mealUnit,
  streakDays,
  streakGoal,
}: TodayGoalsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={appStyles.sectionTitle}>Metas de hoje</Text>
      <View style={styles.goalsCard}>
        <GoalBar
          label="Calorias"
          value={totalCalories}
          goal={calorieGoal}
          unit="kcal"
          color={colors.primary}
        />
        <GoalBar
          label="Água"
          value={waterMl}
          goal={waterGoalMl}
          unit="ml"
          color={colors.water}
        />
        <GoalBar
          label="Refeições"
          value={mealValue}
          goal={mealGoal}
          unit={mealUnit}
          color={colors.success}
        />
        <GoalBar
          label="Sequência"
          value={streakDays}
          goal={streakGoal}
          unit="dias"
          color={colors.warning}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  goalsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, gap: spacing.md,
    ...shadow.sm,
  },
});
