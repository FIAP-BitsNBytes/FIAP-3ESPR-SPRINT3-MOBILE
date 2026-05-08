import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { usePlanDetailContext } from '../context/PlanDetailContext';
import { usePlanPermissions } from '../hooks/usePlanPermissions';

function isoToDisplay(iso: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function PlanHeader() {
  const { items, plan } = usePlanDetailContext();
  const { canEdit } = usePlanPermissions();

  if (!plan) return null;

  const totalKcal = items.reduce((s, i) => s + (i.prescribedCal ?? 0), 0);
  const loggedCount = items.filter(i => i.logId && i.logId !== 'pending').length;
  const mealCount = new Set(items.map(i => i.mealTime)).size;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2}>{plan.title}</Text>
          <View style={styles.datesRow}>
            <Calendar size={12} color={colors.muted} />
            <Text style={styles.datesText}>
              {isoToDisplay(plan.startDate)}
              {plan.endDate ? ` → ${isoToDisplay(plan.endDate)}` : ' → sem término'}
            </Text>
          </View>
        </View>
        {totalKcal > 0 && (
          <View style={styles.kcalBadge}>
            <Text style={styles.kcalValue}>{totalKcal}</Text>
            <Text style={styles.kcalUnit}>kcal/dia</Text>
          </View>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{items.length}</Text>
          <Text style={styles.statLabel}>itens</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{mealCount}</Text>
          <Text style={styles.statLabel}>refeições</Text>
        </View>
        {canEdit ? (
          <>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{loggedCount}</Text>
              <Text style={styles.statLabel}>reg. hoje</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.divider} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: loggedCount === items.length && items.length > 0 ? colors.success : colors.text }]}>
                {loggedCount}/{items.length}
              </Text>
              <Text style={styles.statLabel}>concluídos</Text>
            </View>
          </>
        )}
      </View>

      {plan.notes ? (
        <Text style={styles.notes}>{plan.notes}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    ...shadow.sm,
  },
  top:       { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  title:     { color: colors.text, fontSize: fontSize.lg, fontWeight: '900', marginBottom: 4 },
  datesRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  datesText: { color: colors.muted, fontSize: fontSize.xs },
  kcalBadge: {
    alignItems: 'center',
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  kcalValue: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '900' },
  kcalUnit:  { color: colors.primary, fontSize: 10, fontWeight: '700' },
  statsRow:  { flexDirection: 'row', alignItems: 'center' },
  stat:      { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { color: colors.text, fontSize: fontSize.md, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, fontWeight: '600' },
  divider:   { width: 1, height: 28, backgroundColor: colors.border },
  notes: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
