import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import { usePlanPermissions } from '../hooks/usePlanPermissions';
import { MealItemRow } from './MealItemRow';
import { MEAL_TIME_LABELS, MEAL_TIME_COLORS } from '../types';
import type { MealTimeType, PlanItem } from '../types';

interface MealSectionProps {
  mealTime: MealTimeType;
  items: PlanItem[];
  onEdit?: (item: PlanItem) => void;
  onDelete?: (itemId: string) => void;
  onLog?: (item: PlanItem) => void;
  onAddToMeal?: (mealTime: MealTimeType) => void;
}

export function MealSection({ mealTime, items, onEdit, onDelete, onLog, onAddToMeal }: MealSectionProps) {
  const { canEdit, canLog } = usePlanPermissions();
  const color = MEAL_TIME_COLORS[mealTime];
  const totalKcal = items.reduce((s, i) => s + (i.prescribedCal ?? 0), 0);
  const loggedCount = items.filter(i => i.logId && i.logId !== 'pending').length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={[styles.header, { borderLeftColor: color }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{MEAL_TIME_LABELS[mealTime]}</Text>
          <Text style={styles.meta}>
            {items.length} item{items.length !== 1 ? 's' : ''}
            {totalKcal > 0 ? ` · ${totalKcal} kcal` : ''}
            {canEdit && loggedCount > 0 ? ` · ${loggedCount}/${items.length} registrado${loggedCount !== 1 ? 's' : ''}` : ''}
            {canLog ? ` · ${loggedCount}/${items.length} ✓` : ''}
          </Text>
        </View>
        {canEdit && onAddToMeal && (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: color + '55', backgroundColor: color + '12' }]}
            onPress={() => onAddToMeal(mealTime)}
          >
            <Plus size={13} color={color} />
            <Text style={[styles.addBtnText, { color }]}>+ alimento</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Editor table header (nutritionist only) */}
      {canEdit && (
        <View style={styles.tableHead}>
          <Text style={[styles.tableHeadCell, { flex: 3 }]}>Alimento</Text>
          <Text style={[styles.tableHeadCell, { flex: 2, textAlign: 'center' }]}>Qtd. / Medida</Text>
          <Text style={[styles.tableHeadCell, { flex: 1, textAlign: 'center' }]}>Kcal</Text>
          <View style={{ width: 60 }} />
        </View>
      )}

      {/* Items */}
      {canEdit ? (
        items.map((item, idx) => (
          <MealItemRow
            key={item.itemId}
            item={item}
            isAlt={idx % 2 === 1}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))
      ) : (
        <View style={styles.patientItems}>
          {items.map(item => (
            <MealItemRow
              key={item.itemId}
              item={item}
              onLog={onLog}
            />
          ))}
        </View>
      )}

      {/* Adherence bar (editor) */}
      {canEdit && loggedCount > 0 && (
        <View style={styles.adherenceBar}>
          {items.map(item => {
            const c = item.logId
              ? (item.adherencePct ?? 0) >= 80 ? colors.success
                : (item.adherencePct ?? 0) >= 50 ? colors.warning
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderLeftWidth: 4,
    backgroundColor: colors.background,
  },
  dot:   { width: 10, height: 10, borderRadius: 5 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  meta:  { color: colors.muted, fontSize: fontSize.xs, marginTop: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  addBtnText: { fontSize: 11, fontWeight: '700' },

  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceHigh,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tableHeadCell: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  patientItems:     { padding: spacing.sm, gap: spacing.xs },
  adherenceBar:     { flexDirection: 'row', height: 4, gap: 1 },
  adherenceSegment: { height: '100%' },
});
