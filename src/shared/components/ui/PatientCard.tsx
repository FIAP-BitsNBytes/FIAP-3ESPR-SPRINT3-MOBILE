import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.avatar}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.stats}>
          <Flame size={14} color={streakDays > 0 ? colors.primary : colors.muted} />
          <Text style={styles.stat}>{streakDays}d</Text>
          <Star size={14} color={colors.warning} />
          <Text style={styles.stat}>Nv.{level}</Text>
          <Text style={styles.stat}>{points}pts</Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.muted} />
    </TouchableOpacity>
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
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  info: { flex: 1 },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  stat: { color: colors.muted, fontSize: fontSize.xs },
});
