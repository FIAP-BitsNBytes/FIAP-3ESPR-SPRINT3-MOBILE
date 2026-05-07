import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Phone, Save, ArrowLeft, History, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useClinicManagement } from '../hooks/useClinicManagement';
import { useRouter } from 'expo-router';
import { maskPhone, normalizeToDigits } from '@/shared/utils/format';

export function ClinicSettingsScreen() {
  const router = useRouter();
  const { clinic, isLoading, isSaving, error, updateClinic } = useClinicManagement();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Focus state for UI enhancement
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (clinic && !isInitialized) {
      setName(clinic.name || '');
      setPhone(clinic.phone ? maskPhone(clinic.phone) : '');
      setIsInitialized(true);
    }
  }, [clinic, isInitialized]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome da clínica é obrigatório.');
      return;
    }
    await updateClinic({ 
      name, 
      phone: normalizeToDigits(phone) 
    });
    Alert.alert('Sucesso', 'Dados da clínica atualizados!');
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Minha Clínica</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome da Clínica</Text>
            <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperFocused]}>
              <Building2 size={20} color={focusedField === 'name' ? colors.primary : colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={focusedField === 'name' ? '' : 'Ex: Clínica NutriVida'}
                placeholderTextColor={colors.muted}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone de Contato</Text>
            <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputWrapperFocused]}>
              <Phone size={20} color={focusedField === 'phone' ? colors.primary : colors.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => setPhone(maskPhone(text))}
                placeholder={focusedField === 'phone' ? '' : '(00) 00000-0000'}
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Save size={20} color={colors.background} />
                <Text style={styles.saveText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.auditBtn}
            onPress={() => router.push('/clinic-audit')}
          >
            <History size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.auditTitle}>Logs de Auditoria</Text>
              <Text style={styles.auditSubtitle}>Histórico de alterações da clínica</Text>
            </View>
            <ChevronRight size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.sm,
  },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '800' },
  content: { padding: spacing.lg },
  form: { gap: spacing.xl },
  inputGroup: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600', marginLeft: 4 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surface,
    ...shadow.sm,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: fontSize.md },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadow.primary,
    marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: colors.background, fontSize: fontSize.md, fontWeight: '700' },
  errorText: { color: colors.danger, fontSize: fontSize.sm, marginBottom: spacing.md },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  auditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  auditTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  auditSubtitle: {
    color: colors.muted,
    fontSize: fontSize.xs,
  },
});
