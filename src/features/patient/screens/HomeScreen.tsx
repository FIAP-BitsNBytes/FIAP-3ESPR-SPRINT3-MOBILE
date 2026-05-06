import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, TrendingUp } from 'lucide-react-native';
import { LevelCard } from '@/shared/components/gamification/LevelCard';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import { useAuthContext } from '@/features/auth';

export function PatientHomeScreen() {
  const { user } = useAuthContext();
  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <LevelCard name={user.name} level={1} currentXP={120} maxXP={500} streakDays={3} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Meta do Dia</Text>
          <View style={styles.goalCard}>
            <Text style={styles.goalPercent}>45%</Text>
            <Text style={styles.goalLabel}>das calorias registradas</Text>
            <Text style={styles.goalSub}>900 / 2000 kcal</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} accessibilityRole="button">
            <Plus size={20} color={colors.background} />
            <Text style={styles.actionText}>Registrar Refeição</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionSecondary]} accessibilityRole="button">
            <TrendingUp size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>Ver Evolução</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
  section: { gap: spacing.md },
  sectionTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  goalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalPercent: { color: colors.primary, fontSize: 48, fontWeight: '800' },
  goalLabel: { color: colors.muted, fontSize: fontSize.sm },
  goalSub: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  actions: { gap: spacing.sm },
  actionBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionText: { color: colors.background, fontSize: fontSize.md, fontWeight: '600' },
});
