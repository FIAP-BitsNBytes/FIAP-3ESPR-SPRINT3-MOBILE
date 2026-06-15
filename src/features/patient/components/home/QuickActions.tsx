import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { Plus, Droplets, UtensilsCrossed, Calendar } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';

type IconType = typeof Plus;

interface QuickActionTileProps {
  label: string;
  hint?: string;
  icon: IconType;
  tint: string;
  highlight?: boolean;
  loading?: boolean;
  onPress: () => void;
}

function QuickActionTile({ label, hint, icon: Icon, tint, highlight, loading, onPress }: QuickActionTileProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      style={styles.tileWrap}
      onPressIn={() => { scale.value = withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) }); }}
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.tile, highlight && styles.tileHighlight, animStyle]}>
        <View style={[styles.iconBadge, { backgroundColor: highlight ? colors.onPrimary + '22' : tint + '1A' }]}>
          {loading
            ? <ActivityIndicator size="small" color={highlight ? colors.onPrimary : tint} />
            : <Icon size={22} color={highlight ? colors.onPrimary : tint} />}
        </View>
        <Text style={[styles.tileLabel, highlight && styles.tileLabelHighlight]}>{label}</Text>
        {hint ? <Text style={[styles.tileHint, highlight && styles.tileHintHighlight]}>{hint}</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

interface QuickActionsProps {
  onRegisterMeal: () => void;
  onAddWater: () => void;
  onOpenPlan: () => void;
  onOpenSchedule: () => void;
  waterLoading?: boolean;
}

/**
 * Grade de ações rápidas do dashboard do paciente. Registrar refeição é a ação
 * de destaque; +água registra direto; plano/agenda navegam para as abas.
 */
export function QuickActions({ onRegisterMeal, onAddWater, onOpenPlan, onOpenSchedule, waterLoading }: QuickActionsProps) {
  return (
    <View style={styles.grid}>
      <QuickActionTile label="Registrar refeição" hint="Toque para adicionar" icon={Plus} tint={colors.primary} highlight onPress={onRegisterMeal} />
      <QuickActionTile label="+250ml de água" hint="Registro rápido" icon={Droplets} tint={colors.waterAccent} loading={waterLoading} onPress={onAddWater} />
      <QuickActionTile label="Meu plano" hint="Refeições de hoje" icon={UtensilsCrossed} tint={colors.success} onPress={onOpenPlan} />
      <QuickActionTile label="Agenda" hint="Consultas" icon={Calendar} tint={colors.warning} onPress={onOpenSchedule} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tileWrap: { flexGrow: 1, flexBasis: '47%' },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 104,
    justifyContent: 'space-between',
    ...shadow.sm,
  },
  tileHighlight: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadow.primary,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '800' },
  tileLabelHighlight: { color: colors.onPrimary },
  tileHint: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '600' },
  tileHintHighlight: { color: colors.onPrimary + 'CC' },
});
