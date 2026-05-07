import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Settings } from 'lucide-react-native';
import { colors, fontSize, radius, shadow, spacing } from '@/shared/theme';
import type { PermissionDashboardProfile } from '../domain/dashboard';

interface DashboardHeaderProps {
  profile: PermissionDashboardProfile;
  clinicName?: string | null;
  onSettingsPress?: () => void;
}

export function DashboardHeader({ profile, clinicName, onSettingsPress }: DashboardHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{profile.operationsLabel}</Text>
        <Text style={styles.title}>{profile.title}</Text>
        <Text style={styles.subtitle}>
          {clinicName ? `${clinicName} · ${profile.subtitle}` : profile.subtitle}
        </Text>
      </View>
      {onSettingsPress ? (
        <Pressable
          onPress={onSettingsPress}
          style={styles.settingsBtn}
          accessibilityRole="button"
          accessibilityLabel="Abrir configuracoes da clinica"
        >
          <Settings size={24} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: { flex: 1, gap: 2 },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  title: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '900' },
  subtitle: { color: colors.muted, fontSize: fontSize.sm, lineHeight: 20 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
});
