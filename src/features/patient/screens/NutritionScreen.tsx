import { ScrollView, View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useTodayLogs, MealLogItem } from '../hooks/useTodayLogs';
import { LogType } from '@/shared/infrastructure/supabase/database.types';

const CATEGORY_META: Record<LogType, { label: string; icon: string; color: string }> = {
  MEAL: { label: 'Refeições', icon: '🍽', color: colors.primary },
  WATER: { label: 'Água', icon: '💧', color: '#38BDF8' },
  SUPPLEMENT: { label: 'Suplementos', icon: '💊', color: colors.success },
  EXERCISE: { label: 'Exercício', icon: '🏋', color: colors.warning },
};

const UNIT_LABELS: Record<string, string> = {
  GRAMS: 'g',
  MILLILITERS: 'ml',
  UNITS: 'un',
  PORTIONS: 'porç',
  CALORIES: 'kcal',
};

function LogEntry({ item }: { item: MealLogItem }) {
  const unitLabel = UNIT_LABELS[item.unit] ?? item.unit;
  return (
    <View style={styles.logRow}>
      <View style={styles.logInfo}>
        <Text style={styles.logName} numberOfLines={1}>{item.foodName}</Text>
        <Text style={styles.logMeta}>{item.quantity}{unitLabel}{item.calories ? ` · ${item.calories} kcal` : ''}</Text>
      </View>
    </View>
  );
}

function CategorySection({ category, items }: { category: LogType; items: MealLogItem[] }) {
  const meta = CATEGORY_META[category];
  return (
    <View style={styles.mealCard}>
      <View style={styles.mealLeft}>
        <View style={styles.mealIconWrap}>
          <Text style={styles.mealIcon}>{meta.icon}</Text>
        </View>
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meta.label}</Text>
          {items.length === 0
            ? <Text style={styles.mealEmpty}>Nenhum registro</Text>
            : <Text style={styles.mealMeta}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
          }
        </View>
      </View>
      <View style={styles.mealRight}>
        {items.length > 0 && (
          <Text style={[styles.mealCal, { color: meta.color }]}>
            {items.reduce((s, i) => s + (i.calories ?? 0), 0)}
          </Text>
        )}
        {items.length > 0 && <Text style={styles.mealCalUnit}>kcal</Text>}
        <Pressable style={[styles.addBtn, { borderColor: meta.color + '44', backgroundColor: meta.color + '18' }]} accessibilityRole="button" accessibilityLabel={`Adicionar em ${meta.label}`}>
          <Plus size={16} color={meta.color} />
        </Pressable>
      </View>
    </View>
  );
}

const MACRO_CATEGORIES: LogType[] = ['MEAL', 'WATER', 'SUPPLEMENT', 'EXERCISE'];

export function PatientNutritionScreen() {
  const { meals, totalCalories, waterMl, isLoading, error } = useTodayLogs();

  const grouped = MACRO_CATEGORIES.reduce<Record<LogType, MealLogItem[]>>(
    (acc, cat) => {
      acc[cat] = meals.filter(m => m.category === cat);
      return acc;
    },
    { MEAL: [], WATER: [], SUPPLEMENT: [], EXERCISE: [] },
  );

  const waterL = (waterMl / 1000).toFixed(1);
  const supplementCount = grouped.SUPPLEMENT.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Nutrição</Text>
          <Text style={styles.subtitle}>Hoje, {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
        </View>

        <View style={styles.macroGrid}>
          <View style={[styles.macroCard, { borderTopColor: colors.primary }]}>
            <Text style={[styles.macroValue, { color: colors.primary }]}>{totalCalories}</Text>
            <Text style={styles.macroLabel}>Kcal</Text>
          </View>
          <View style={[styles.macroCard, { borderTopColor: '#38BDF8' }]}>
            <Text style={[styles.macroValue, { color: '#38BDF8' }]}>{waterL}L</Text>
            <Text style={styles.macroLabel}>Água</Text>
          </View>
          <View style={[styles.macroCard, { borderTopColor: colors.success }]}>
            <Text style={[styles.macroValue, { color: colors.success }]}>{grouped.MEAL.length}</Text>
            <Text style={styles.macroLabel}>Refeições</Text>
          </View>
          <View style={[styles.macroCard, { borderTopColor: colors.warning }]}>
            <Text style={[styles.macroValue, { color: colors.warning }]}>{supplementCount}</Text>
            <Text style={styles.macroLabel}>Suplem.</Text>
          </View>
        </View>

        {isLoading && <ActivityIndicator color={colors.primary} />}
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registros</Text>
          {MACRO_CATEGORIES.map(cat => (
            <CategorySection key={cat} category={cat} items={grouped[cat]} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: 2 },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: fontSize.sm, textTransform: 'capitalize' },
  macroGrid: { flexDirection: 'row', gap: spacing.sm },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 3,
    borderTopWidth: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  macroValue: { fontSize: fontSize.sm, fontWeight: '800' },
  macroLabel: { color: colors.muted, fontSize: 10 },
  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  mealCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  mealLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  mealIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealIcon: { fontSize: 20 },
  mealInfo: { flex: 1 },
  mealName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  mealEmpty: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  mealMeta: { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  mealRight: { alignItems: 'flex-end', gap: 2 },
  mealCal: { fontSize: fontSize.md, fontWeight: '800' },
  mealCalUnit: { color: colors.muted, fontSize: 10 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  logRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: spacing.xs },
  logInfo: { flex: 1 },
  logName: { color: colors.text, fontSize: fontSize.sm },
  logMeta: { color: colors.muted, fontSize: fontSize.xs },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
});
