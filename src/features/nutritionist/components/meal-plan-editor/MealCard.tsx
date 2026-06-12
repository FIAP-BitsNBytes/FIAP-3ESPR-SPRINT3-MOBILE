import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Pencil, Plus, Trash2 } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { MEAL_TIME_LABELS, MEAL_TIME_COLORS, UNIT_LABELS } from '@/features/nutrition';
import type { MealTimeType } from '@/features/nutrition';
import type { NutritionistPlanItem } from '../../hooks/useMealPlan';

interface MealCardProps {
  mealTime: MealTimeType;
  items: NutritionistPlanItem[];
  onEdit: (item: NutritionistPlanItem) => void;
  onDelete: (itemId: string) => void;
  onAddToMeal: (mealTime: MealTimeType) => void;
}

/**
 * Card grouping a meal time's prescribed items in a compact table,
 * with an adherence color bar reflecting today's logged consumption.
 */
export function MealCard({ mealTime, items, onEdit, onDelete, onAddToMeal }: MealCardProps) {
  const color = MEAL_TIME_COLORS[mealTime];
  const totalKcal = items.reduce((s, i) => s + (i.prescribedCal ?? 0), 0);
  const loggedCount = items.filter(i => i.logId).length;

  return (
    <View style={styles.mealCard}>
      {/* Card header */}
      <View style={[styles.mealCardHeader, { borderLeftColor: color }]}>
        <View style={[styles.mealDot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.mealCardTitle}>{MEAL_TIME_LABELS[mealTime]}</Text>
          <Text style={styles.mealCardMeta}>
            {items.length} item{items.length !== 1 ? 's' : ''}
            {totalKcal > 0 ? ` · ${totalKcal} kcal` : ''}
            {loggedCount > 0 ? ` · ${loggedCount}/${items.length} registrado${loggedCount !== 1 ? 's' : ''}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.mealAddBtn, { borderColor: color + '55', backgroundColor: color + '12' }]}
          onPress={() => onAddToMeal(mealTime)}
        >
          <Plus size={13} color={color} />
          <Text style={[styles.mealAddBtnText, { color }]}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Table header */}
      <View style={styles.tableHead}>
        <Text style={[styles.tableHeadCell, { flex: 3 }]}>Alimento</Text>
        <Text style={[styles.tableHeadCell, { flex: 2, textAlign: 'center' }]}>Qtd. / Medida</Text>
        <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Kcal</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Rows */}
      {items.map((item, idx) => (
        <View
          key={item.itemId}
          style={[
            styles.tableRow,
            idx % 2 === 1 && styles.tableRowAlt,
            item.logId ? styles.tableRowLogged : null,
          ]}
        >
          <View style={{ flex: 3 }}>
            <Text style={styles.tableCellMain} numberOfLines={1}>{item.foodName}</Text>
            {item.purpose ? (
              <Text style={styles.tableCellSub} numberOfLines={1}>{item.purpose}</Text>
            ) : null}
          </View>
          <Text style={[styles.tableCell, { flex: 2, textAlign: 'center' }]}>
            {item.prescribedQty} {UNIT_LABELS[item.prescribedUnit]}
          </Text>
          <Text style={[styles.tableCell, { flex: 1, textAlign: 'center' }]}>
            {item.prescribedCal ?? '—'}
          </Text>
          <View style={styles.tableActions}>
            <TouchableOpacity style={styles.tableActionBtn} onPress={() => onEdit(item)}>
              <Pencil size={13} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tableActionBtn, styles.tableActionDanger]}
              onPress={() =>
                Alert.alert('Remover item', `Remover "${item.foodName}" do plano?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Remover', style: 'destructive', onPress: () => onDelete(item.itemId) },
                ])
              }
            >
              <Trash2 size={13} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Adherence color bar */}
      {loggedCount > 0 && (
        <View style={styles.adherenceBar}>
          {items.map(item => {
            const c = item.logId
              ? item.adherencePct >= 80 ? colors.success
                : item.adherencePct >= 50 ? colors.warning
                : colors.danger
              : colors.border;
            return <View key={item.itemId} style={[styles.adherenceSegment, { flex: 1, backgroundColor: c }]} />;
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Meal card
  mealCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.sm,
  },
  mealCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderLeftWidth: 4, backgroundColor: colors.background,
  },
  mealDot:       { width: 10, height: 10, borderRadius: 5 },
  mealCardTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  mealCardMeta:  { color: colors.muted, fontSize: fontSize.xs, marginTop: 1 },
  mealAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    borderRadius: radius.md, borderWidth: 1,
  },
  mealAddBtnText: { fontSize: 11, fontWeight: '700' },

  // Table
  tableHead: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceHigh,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  tableHeadCell: { color: colors.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.border + '55',
  },
  tableRowAlt:    { backgroundColor: colors.background },
  tableRowLogged: { backgroundColor: colors.success + '08' },
  tableCellMain:  { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  tableCellSub:   { color: colors.muted, fontSize: 10, fontStyle: 'italic' },
  tableCell:      { color: colors.textSecondary, fontSize: fontSize.sm },
  tableActions:   { width: 60, flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  tableActionBtn: {
    width: 26, height: 26, borderRadius: radius.sm,
    backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  tableActionDanger: {
    backgroundColor: colors.danger + '15',
    borderColor: colors.danger + '33',
  },
  adherenceBar:    { flexDirection: 'row', height: 4, gap: 1 },
  adherenceSegment: { height: '100%' },
});
