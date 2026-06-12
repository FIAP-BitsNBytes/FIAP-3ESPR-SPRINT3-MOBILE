import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, ClipboardList, Plus } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import { PlanItem, PlanMeta } from '@/features/nutrition';

interface MealPlanEntryCardProps {
  plan: PlanMeta | null;
  planItems: PlanItem[];
  isPlanLoading: boolean;
  planAdherencePct: number | null;
  onPress: () => void;
}

export function MealPlanEntryCard({ plan, planItems, isPlanLoading, planAdherencePct, onPress }: MealPlanEntryCardProps) {
  return (
    <TouchableOpacity style={styles.planCard} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.planCardIcon}>
        <ClipboardList size={22} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.planCardTitle}>Plano Alimentar</Text>
        {isPlanLoading ? (
          <Text style={styles.planCardSub}>Carregando...</Text>
        ) : plan ? (
          <Text style={styles.planCardSub} numberOfLines={1}>
            {plan.title} · {planItems.length} item{planItems.length !== 1 ? 's' : ''}
            {planAdherencePct !== null ? ` · ${planAdherencePct}% adesão hoje` : ''}
          </Text>
        ) : (
          <View style={styles.planCardNoplan}>
            <Plus size={11} color={colors.primary} />
            <Text style={styles.planCardNoPlanText}>Criar plano</Text>
          </View>
        )}
      </View>
      <ChevronRight size={18} color={colors.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1, borderColor: colors.primary + '44',
    ...shadow.sm,
  },
  planCardIcon: {
    width: 40, height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.primary + '33',
  },
  planCardTitle:      { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  planCardSub:        { color: colors.muted, fontSize: fontSize.xs, marginTop: 2 },
  planCardNoplan:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  planCardNoPlanText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
});
