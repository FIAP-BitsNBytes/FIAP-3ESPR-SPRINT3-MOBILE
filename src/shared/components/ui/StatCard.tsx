import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  color?: string;
  onPress?: () => void;
}

export function StatCard({ label, value, Icon, color = colors.primary, onPress }: StatCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 80, easing: Easing.out(Easing.quad) });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  };

  return (
    <Pressable
      style={styles.pressable}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityRole="button"
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <Animated.View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
          <Icon size={20} color={color} />
        </Animated.View>
        <Text style={[styles.value, { color }]}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  value: { fontSize: fontSize.xl, fontWeight: '900' },
  label: { color: colors.textSecondary, fontSize: fontSize.xs, fontWeight: '700' },
});
