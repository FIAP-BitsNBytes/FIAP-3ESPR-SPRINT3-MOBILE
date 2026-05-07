import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { XPProgressBar } from './XPProgressBar';
import { StreakBadge } from './StreakBadge';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
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
      <View style={styles.topAccent} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Olá, {name.split(' ')[0]} 👋</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Zap size={14} color={colors.primary} fill={colors.primary} />
          <Text style={styles.levelNum}>{level}</Text>
        </View>
      </View>

      <XPProgressBar currentXP={currentXP} maxXP={maxXP} level={level} />

      <View style={styles.footer}>
        <StreakBadge days={streakDays} />
        <Text style={styles.streakLabel}>sequência ativa</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    overflow: 'hidden',
    ...shadow.md,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  headerLeft: { gap: 2 },
  greeting: { color: colors.muted, fontSize: fontSize.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.5 },
  levelBadge: {
    backgroundColor: colors.primaryGlow,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  levelNum: { color: colors.primary, fontWeight: '800', fontSize: fontSize.md },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  streakLabel: { color: colors.muted, fontSize: fontSize.xs },
});
