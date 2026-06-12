import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ArrowLeft, ClipboardList, Lock, LockOpen } from 'lucide-react-native';
import { appStyles, colors, radius, spacing, fontSize } from '@/shared/theme';

interface PatientDetailHeaderProps {
  patientName: string;
  onBack: () => void;
  onOpenMealPlan: () => void;
  isBottleOnline?: boolean;
  clinicAccessGranted?: boolean;
  onToggleClinicAccess?: () => Promise<void>;
  isTogglingAccess?: boolean;
}

export function PatientDetailHeader({
  patientName,
  onBack,
  onOpenMealPlan,
  isBottleOnline,
  clinicAccessGranted,
  onToggleClinicAccess,
  isTogglingAccess,
}: PatientDetailHeaderProps) {
  const handleToggleAccess = async () => {
    if (onToggleClinicAccess && !isTogglingAccess) {
      await onToggleClinicAccess();
    }
  };

  return (
    <View style={[appStyles.dashboardHeader, styles.header]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <ArrowLeft size={20} color={colors.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={appStyles.dashboardTitle} numberOfLines={1}>{patientName}</Text>
        <Text style={appStyles.dashboardSubtitle}>Evolução e progresso</Text>
        <View style={styles.badgesRow}>
          {isBottleOnline && (
            <View style={styles.bottleBadge}>
              <Text style={styles.bottleBadgeText}>💧 Garrafa online</Text>
            </View>
          )}
          {clinicAccessGranted !== undefined && (
            <TouchableOpacity
              style={[styles.consentBadge, clinicAccessGranted && styles.consentGranted]}
              onPress={handleToggleAccess}
              disabled={isTogglingAccess}
            >
              {isTogglingAccess ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <>
                  {clinicAccessGranted ? (
                    <LockOpen size={12} color={colors.success} />
                  ) : (
                    <Lock size={12} color={colors.muted} />
                  )}
                  <Text style={[styles.consentText, clinicAccessGranted && styles.consentTextGranted]}>
                    {clinicAccessGranted ? 'Clínica autorizada' : 'Clínica bloqueada'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
  badgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  bottleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.waterAccent + '22',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  bottleBadgeText: {
    fontSize: fontSize.xs,
    color: colors.waterAccent,
    fontWeight: '700',
  },
  consentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.muted + '15',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.muted + '33',
  },
  consentGranted: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success + '33',
  },
  consentText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: '600',
  },
  consentTextGranted: {
    color: colors.success,
  },
});
