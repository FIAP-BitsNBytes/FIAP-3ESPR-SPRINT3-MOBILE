import { StyleSheet, Pressable, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Flame, Star, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';

interface PatientCardProps {
  name: string;
  level: number;
  streakDays: number;
  points: number;
  onPress?: () => void;
}

export function PatientCard({ name, level, streakDays, points, onPress }: PatientCardProps) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const flameColor = streakDays >= 7 ? colors.success : streakDays > 0 ? colors.primary : colors.muted;

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 80, easing: Easing.out(Easing.quad) });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 200, easing: Easing.bezier(0.16, 1, 0.3, 1) });
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Paciente ${name}, nível ${level}, ${streakDays} dias de sequência`}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <View style={styles.stats}>
            <Flame size={13} color={flameColor} />
            <Text style={[styles.stat, { color: flameColor }]}>{streakDays}d</Text>
            <View style={styles.dot} />
            <Star size={13} color={colors.warning} />
            <Text style={styles.stat}>Nv.{level}</Text>
            <View style={styles.dot} />
            <Text style={styles.stat}>{points} pts</Text>
          </View>
        </View>
        <ChevronRight size={18} color={colors.muted} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '44',
  },
  initials: { color: colors.primary, fontWeight: '800', fontSize: fontSize.md },
  info: { flex: 1, gap: 3 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stat: { color: colors.muted, fontSize: fontSize.xs },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.muted },
});
