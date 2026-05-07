import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LockKeyhole, Mail, ShieldCheck, Stethoscope } from 'lucide-react-native';
import { useAuthContext } from '../context/AuthContext';
import { appStyles } from '@/shared/theme/appStyles';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

type FocusedField = 'email' | 'password' | null;

export function LoginScreen() {
  const { login } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<FocusedField>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
      // AuthGate em _layout.tsx navega para /(tabs) via onAuthStateChange
    } catch {
      setError('E-mail ou senha invalidos.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={appStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[appStyles.screenContent, appStyles.centeredContent, styles.content]}
      >
        <View style={styles.brandPanel}>
          <View style={styles.brandTopRow}>
            <View style={appStyles.iconBadge}>
              <Stethoscope size={22} color={colors.primary} />
            </View>
            <View style={styles.brandCopy}>
              <Text style={appStyles.eyebrow}>NutriApp</Text>
              <Text style={styles.brandLockup}>Clinica conectada</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Controle nutricional com seguranca clinica.</Text>
          <Text style={styles.heroText}>
            Acesse agenda, evolucao dos pacientes e gamificacao em um ambiente protegido por Supabase.
          </Text>

          <View style={styles.signalRow}>
            <View style={styles.signalItem}>
              <ShieldCheck size={16} color={colors.success} />
              <Text style={styles.signalText}>RLS ativo</Text>
            </View>
            <View style={styles.signalItem}>
              <Text style={styles.signalDot} />
              <Text style={styles.signalText}>Auditoria</Text>
            </View>
          </View>
        </View>

        <View style={[appStyles.elevatedCard, appStyles.cardPadding, styles.loginCard]}>
          <View style={appStyles.pageHeader}>
            <Text style={appStyles.title}>Entrar</Text>
            <Text style={appStyles.subtitle}>Use sua conta para continuar.</Text>
          </View>

          <View style={styles.form}>
            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>E-mail</Text>
              <View style={[appStyles.inputFrame, focusedField === 'email' && appStyles.inputFrameFocused]}>
                <Mail size={20} color={focusedField === 'email' ? colors.primary : colors.muted} />
                <TextInput
                  style={appStyles.input}
                  placeholder="nome@clinica.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  accessibilityLabel="E-mail"
                />
              </View>
            </View>

            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>Senha</Text>
              <View style={[appStyles.inputFrame, focusedField === 'password' && appStyles.inputFrameFocused]}>
                <LockKeyhole size={20} color={focusedField === 'password' ? colors.primary : colors.muted} />
                <TextInput
                  style={appStyles.input}
                  placeholder="Sua senha"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                  accessibilityLabel="Senha"
                />
              </View>
            </View>

            {error ? (
              <View style={appStyles.errorBox} accessibilityRole="alert">
                <Text style={appStyles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              style={[appStyles.primaryButton, isLoading && appStyles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={appStyles.primaryButtonText}>Entrar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  content: {
    gap: spacing.lg,
  },
  brandPanel: {
    width: '100%' as const,
    maxWidth: 460,
    alignSelf: 'center' as const,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
  },
  brandTopRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
  },
  brandCopy: {
    flex: 1,
  },
  brandLockup: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '900' as const,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900' as const,
    letterSpacing: 0,
  },
  heroText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 23,
  },
  signalRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
    flexWrap: 'wrap' as const,
  },
  signalItem: {
    minHeight: 36,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  signalText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '800' as const,
  },
  loginCard: {
    width: '100%' as const,
    maxWidth: 460,
    alignSelf: 'center' as const,
    gap: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
};
