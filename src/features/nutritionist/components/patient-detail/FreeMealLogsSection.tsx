import { StyleSheet, Text, View } from 'react-native';
import { MealPhotoThumb } from '@/shared/components/MealPhotoThumb';
import { appStyles, colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import type { MealLogItem } from '@/features/patient/hooks/useTodayLogs';

interface FreeMealLogsSectionProps {
  /** All today's meal-log entries (MEAL category only — caller must pre-filter). */
  freeMeals: MealLogItem[];
}

/**
 * Renders the patient's free meal logs for today inside the nutritionist patient detail.
 * Shows a photo thumbnail (via signed URL) when available and an "IoT" badge when
 * `source === 'IOT'`. Returns null when `freeMeals` is empty to avoid dead space.
 */
export function FreeMealLogsSection({ freeMeals }: FreeMealLogsSectionProps) {
  if (freeMeals.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={appStyles.sectionTitle}>Refeições livres de hoje</Text>
      <View style={styles.list}>
        {freeMeals.map(meal => {
          const isIot = meal.source?.toUpperCase() === 'IOT';
          return (
            <View key={meal.id} style={styles.row}>
              {meal.photoPath && <MealPhotoThumb photoPath={meal.photoPath} size={56} />}
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{meal.foodName}</Text>
                  {isIot && (
                    <View style={styles.iotBadge}>
                      <Text style={styles.iotBadgeText}>IoT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.meta}>
                  {meal.quantity} {meal.unit.toLowerCase()}
                  {meal.calories != null ? ` · ${meal.calories} kcal` : ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.sm,
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  name: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', flexShrink: 1 },
  meta: { color: colors.muted, fontSize: fontSize.xs },
  iotBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.waterAccent + '22',
    borderWidth: 1,
    borderColor: colors.waterAccent + '55',
  },
  iotBadgeText: { color: colors.waterAccent, fontSize: 10, fontWeight: '700', lineHeight: 14 },
});
