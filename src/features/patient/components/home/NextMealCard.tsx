import { View, Text, StyleSheet, Pressable } from 'react-native';
import { UtensilsCrossed, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { MEAL_TIME_LABELS, UNIT_LABELS } from '@/features/nutrition';
import type { PlanItem } from '../../hooks/useDailyPlan';

interface NextMealCardProps {
  /** Item do plano ainda não registrado. Null = nada pendente. */
  nextItem: PlanItem | null;
  /** Há plano com itens hoje (distingue "tudo feito" de "sem plano"). */
  hasPlan: boolean;
  onPress: () => void;
}

/**
 * Mostra a próxima refeição pendente do plano de hoje no dashboard.
 * Três estados: pendente (item), tudo registrado, ou sem plano.
 */
export function NextMealCard({ nextItem, hasPlan, onPress }: NextMealCardProps) {
  if (!hasPlan) {
    return (
      <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel="Ver plano alimentar">
        <View style={[styles.iconBadge, { backgroundColor: colors.muted + '1A' }]}>
          <UtensilsCrossed size={20} color={colors.muted} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Sem plano para hoje</Text>
          <Text style={styles.sub}>Use o registro livre para anotar suas refeições</Text>
        </View>
        <ChevronRight size={20} color={colors.muted} />
      </Pressable>
    );
  }

  if (!nextItem) {
    return (
      <View style={[styles.card, styles.cardDone]}>
        <View style={[styles.iconBadge, { backgroundColor: colors.success + '1A' }]}>
          <CheckCircle2 size={20} color={colors.success} />
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>Plano completo! 🎉</Text>
          <Text style={styles.sub}>Todas as refeições de hoje registradas</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Registrar ${nextItem.foodName}`}>
      <View style={[styles.iconBadge, { backgroundColor: colors.primary + '1A' }]}>
        <UtensilsCrossed size={20} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>{MEAL_TIME_LABELS[nextItem.mealTime]}</Text>
        <Text style={styles.title} numberOfLines={1}>{nextItem.foodName}</Text>
        <Text style={styles.sub}>
          {nextItem.prescribedQty} {UNIT_LABELS[nextItem.prescribedUnit]}
          {nextItem.prescribedCal ? ` · ${nextItem.prescribedCal} kcal` : ''}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardDone: { borderColor: colors.success + '55' },
  iconBadge: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  eyebrow: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  sub: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '500' },
});
