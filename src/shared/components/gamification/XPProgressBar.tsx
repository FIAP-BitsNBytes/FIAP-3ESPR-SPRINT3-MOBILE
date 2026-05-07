import { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { colors, spacing, radius, fontSize, timing } from '@/shared/theme';

interface XPProgressBarProps {
  currentXP: number;
  maxXP: number;
  level: number;
}

export function XPProgressBar({ currentXP, maxXP, level }: XPProgressBarProps) {
  const progress = Math.min(currentXP / maxXP, 1);
  const fillWidth = useSharedValue(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      runOnJS(setContainerWidth)(w);
      fillWidth.value = withTiming(progress * w, {
        duration: timing.xpBar,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
      });
    }
  };

  const animatedFill = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.levelText}>Nível {level}</Text>
        <Text style={styles.xpText}>
          {currentXP.toLocaleString('pt-BR')}/{maxXP.toLocaleString('pt-BR')} XP
        </Text>
      </View>
      <View style={styles.track} onLayout={onLayout}>
        <Animated.View style={[styles.fill, animatedFill]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  labels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  levelText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  xpText: { color: colors.muted, fontSize: fontSize.xs },
  track: {
    height: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
});
