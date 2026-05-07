import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Flame } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface StreakBadgeProps {
  days: number;
}

export function StreakBadge({ days }: StreakBadgeProps) {
  const flameColor = days >= 7 ? colors.success : days > 0 ? colors.primary : colors.muted;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (days > 0) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 600, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = 1;
    }
  }, [days, scale]);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const borderColor = days >= 7 ? colors.success : days > 0 ? colors.primary : 'transparent';

  return (
    <View style={[styles.container, { borderColor }]}>
      <Animated.View style={animatedStyle}>
        <Flame size={18} color={flameColor} fill={days > 0 ? flameColor + '66' : 'transparent'} />
      </Animated.View>
      <Text style={[styles.days, { color: flameColor }]}>{days}</Text>
      <Text style={styles.label}>dias</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    gap: spacing.xs,
    borderWidth: 1.5,
  },
  days: { fontSize: fontSize.sm, fontWeight: '800' },
  label: { fontSize: fontSize.xs, color: colors.muted },
});
