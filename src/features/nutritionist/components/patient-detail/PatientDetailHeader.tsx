import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft, ClipboardList } from 'lucide-react-native';
import { appStyles, colors, radius, spacing, fontSize } from '@/shared/theme';

interface PatientDetailHeaderProps {
  patientName: string;
  onBack: () => void;
  onOpenMealPlan: () => void;
  isBottleOnline?: boolean;
}

export function PatientDetailHeader({ patientName, onBack, onOpenMealPlan, isBottleOnline }: PatientDetailHeaderProps) {
  return (
    <View style={[appStyles.dashboardHeader, styles.header]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={appStyles.dashboardTitle} numberOfLines={1}>{patientName}</Text>
        <Text style={appStyles.dashboardSubtitle}>Evolução e progresso</Text>
        {isBottleOnline && (
          <View style={styles.bottleBadge}>
            <Text style={styles.bottleBadgeText}>💧 Garrafa online</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.mealPlanBtn} onPress={onOpenMealPlan}>
        <ClipboardList size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  mealPlanBtn: {
    width: 36, height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  bottleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.waterAccent + '22',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  bottleBadgeText: {
    fontSize: fontSize.xs,
    color: colors.waterAccent,
    fontWeight: '700',
  },
});
