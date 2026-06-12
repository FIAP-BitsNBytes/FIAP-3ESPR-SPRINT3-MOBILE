import { StyleSheet, Text, View } from 'react-native';
import { appStyles, spacing } from '@/shared/theme';
import { DailyProgressItem } from '@/features/patient/hooks/useProgressMetrics';
import { WeeklyChart } from './WeeklyChart';

interface WeeklyChartsSectionProps {
  days: DailyProgressItem[];
  calorieGoal: number;
  waterGoalMl: number;
  today: string;
}

export function WeeklyChartsSection({ days, calorieGoal, waterGoalMl, today }: WeeklyChartsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={appStyles.sectionTitle}>Evolução semanal</Text>
      <WeeklyChart
        title="Calorias"
        days={days}
        getValue={d => d.calories}
        goal={calorieGoal}
        unit="kcal"
        todayKey={today}
      />
      <WeeklyChart
        title="Água"
        days={days}
        getValue={d => Math.round(d.waterMl / 100) / 10}
        goal={Math.round(waterGoalMl / 100) / 10}
        unit="L"
        todayKey={today}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
});
