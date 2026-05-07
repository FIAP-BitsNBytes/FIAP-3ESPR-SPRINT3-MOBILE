import { useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { KeyRound, ShieldCheck, Stethoscope } from 'lucide-react-native';
import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '../context/AuthContext';
import { appStyles } from '@/shared/theme/appStyles';
import { colors, fontSize, radius, spacing } from '@/shared/theme';

type SetupState = 'checking' | 'ready' | 'saving' | 'done' | 'error';

function readUrlParams() {
  if (typeof window === 'undefined') return new URLSearchParams();

  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;

  new URLSearchParams(hash).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value);
  });

  return params;
}

async function hydrateInviteSession() {
  const params = readUrlParams();
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  const code = params.get('code');

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return;
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Link de convite invalido ou expirado.');
}

export function AcceptInviteScreen() {
  const router = useRouter();
  const { refreshUser } = useAuthContext();
  const [state, setState] = useState<SetupState>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => password.length >= 8 && password === confirmPassword && state !== 'saving',
    [confirmPassword, password, state],
  );

  useEffect(() => {
    let mounted = true;

    hydrateInviteSession()
      .then(() => {
        if (mounted) setState('ready');
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Nao foi possivel validar o convite.');
        setState('error');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async () => {
    if (password.length < 8) {
      setError('Use uma senha com pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    setState('saving');
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setState('ready');
      return;
    }

    await supabase.rpc('accept_current_invite');

    await refreshUser();
    setState('done');
    router.replace('/(tabs)');
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
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <View style={appStyles.iconBadge}>
              <Stethoscope size={22} color={colors.primary} />
            </View>
            <View style={styles.brandText}>
              <Text style={appStyles.eyebrow}>NutriApp</Text>
              <Text style={styles.brandTitle}>Aceitar convite</Text>
            </View>
          </View>

          <View style={appStyles.pageHeader}>
            <Text style={appStyles.title}>Crie sua senha</Text>
            <Text style={appStyles.subtitle}>
              Defina a senha da sua conta para finalizar o convite e acessar a plataforma.
            </Text>
          </View>

          {state === 'checking' ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.primary} />
              <Text style={appStyles.mutedText}>Validando convite...</Text>
            </View>
          ) : null}

          {state === 'ready' || state === 'saving' ? (
            <View style={styles.form}>
              <View style={appStyles.formGroup}>
                <Text style={appStyles.fieldLabel}>Nova senha</Text>
                <View style={appStyles.inputFrame}>
                  <KeyRound size={20} color={colors.muted} />
                  <TextInput
                    style={appStyles.input}
                    placeholder="Minimo 8 caracteres"
                    placeholderTextColor={colors.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                </View>
              </View>

              <View style={appStyles.formGroup}>
                <Text style={appStyles.fieldLabel}>Confirmar senha</Text>
                <View style={appStyles.inputFrame}>
                  <ShieldCheck size={20} color={colors.muted} />
                  <TextInput
                    style={appStyles.input}
                    placeholder="Repita a senha"
                    placeholderTextColor={colors.muted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoComplete="new-password"
                    textContentType="newPassword"
                  />
                </View>
              </View>

              {error ? (
                <View style={appStyles.errorBox} accessibilityRole="alert">
                  <Text style={appStyles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[appStyles.primaryButton, !canSubmit && appStyles.primaryButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}
                accessibilityRole="button"
              >
                {state === 'saving' ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={appStyles.primaryButtonText}>Salvar senha</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {state === 'error' ? (
            <View style={appStyles.errorBox} accessibilityRole="alert">
              <Text style={appStyles.errorText}>{error}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  content: {
    alignItems: 'center' as const,
  },
  card: {
    width: '100%' as const,
    maxWidth: 460,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    gap: spacing.xl,
  },
  brandRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
  },
  brandText: {
    flex: 1,
  },
  brandTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '900' as const,
  },
  form: {
    gap: spacing.md,
  },
  loadingBox: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
  },
};
