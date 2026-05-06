import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { XPProgressBar } from './XPProgressBar';
import { StreakBadge } from './StreakBadge';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import { LEVEL_TITLES } from '@/shared/domain/gamification';

interface LevelCardProps {
  level: number;
  currentXP: number;
  maxXP: number;
  streakDays: number;
  name: string;
}

export function LevelCard({ level, currentXP, maxXP, streakDays, name }: LevelCardProps) {
  const title = LEVEL_TITLES[level] ?? `Nível ${level}`;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {name.split(' ')[0]}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Star size={16} color={colors.primary} />
          <Text style={styles.levelNum}>{level}</Text>
        </View>
      </View>
      <XPProgressBar currentXP={currentXP} maxXP={maxXP} level={level} />
      <View style={styles.streak}>
        <StreakBadge days={streakDays} />
        <Text style={styles.streakLabel}>sequência atual</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: colors.muted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  levelBadge: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: radius.full,
    padding: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelNum: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streakLabel: { color: colors.muted, fontSize: fontSize.sm },
});
