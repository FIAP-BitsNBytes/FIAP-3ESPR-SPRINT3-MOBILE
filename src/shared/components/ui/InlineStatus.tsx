import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { Text, View, StyleSheet } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

type InlineStatusVariant = 'success' | 'error' | 'info';

type InlineStatusProps = {
  variant: InlineStatusVariant;
  message: string;
};

const VARIANT_CONFIG = {
  success: {
    Icon: CheckCircle,
    color: colors.success,
    backgroundColor: colors.successGlow,
  },
  error: {
    Icon: AlertCircle,
    color: colors.danger,
    backgroundColor: 'rgba(220,38,38,0.08)',
  },
  info: {
    Icon: Info,
    color: colors.info,
    backgroundColor: 'rgba(37,99,235,0.08)',
  },
} as const;

export function InlineStatus({ variant, message }: InlineStatusProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.Icon;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.backgroundColor, borderColor: config.color },
      ]}
      accessibilityRole="alert"
    >
      <Icon size={18} color={config.color} />
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
