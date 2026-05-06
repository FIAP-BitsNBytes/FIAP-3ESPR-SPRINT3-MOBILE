import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

const MEALS = [
  { name: 'Café da Manhã', calories: 350, protein: 20, carbs: 45, fat: 10 },
  { name: 'Almoço', calories: 550, protein: 35, carbs: 60, fat: 15 },
  { name: 'Lanche', calories: 200, protein: 8, carbs: 25, fat: 6 },
  { name: 'Jantar', calories: 0, protein: 0, carbs: 0, fat: 0 },
];

export function PatientNutritionScreen() {
  const total = MEALS.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Hoje</Text>

        <View style={styles.macroRow}>
          {[
            { label: 'Calorias', value: `${total.calories}kcal`, color: colors.primary },
            { label: 'Proteína', value: `${total.protein}g`, color: colors.success },
            { label: 'Carbs', value: `${total.carbs}g`, color: colors.warning },
            { label: 'Gordura', value: `${total.fat}g`, color: colors.secondary },
          ].map(({ label, value, color }) => (
            <View key={label} style={styles.macroCard}>
              <Text style={[styles.macroValue, { color }]}>{value}</Text>
              <Text style={styles.macroLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {MEALS.map((meal) => (
          <View key={meal.name} style={styles.mealCard}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealCal}>{meal.calories} kcal</Text>
            </View>
            {meal.calories === 0 ? (
              <Text style={styles.mealEmpty}>Nenhum registro</Text>
            ) : (
              <Text style={styles.mealMacros}>P: {meal.protein}g · C: {meal.carbs}g · G: {meal.fat}g</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '800' },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  macroValue: { fontSize: fontSize.sm, fontWeight: '700' },
  macroLabel: { color: colors.muted, fontSize: fontSize.xs },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  mealName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  mealCal: { color: colors.primary, fontSize: fontSize.md, fontWeight: '700' },
  mealEmpty: { color: colors.muted, fontSize: fontSize.sm },
  mealMacros: { color: colors.muted, fontSize: fontSize.sm },
});
