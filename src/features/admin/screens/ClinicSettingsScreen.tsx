import { useState, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Building2, Phone, Save, ArrowLeft, History, ChevronRight, Info, MapPin, Globe } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow, appStyles } from '@/shared/theme';
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
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <View style={appStyles.dashboardHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={appStyles.dashboardTitle}>Configurações</Text>
          <Text style={appStyles.dashboardSubtitle}>Gerencie os dados da sua unidade</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorContainer}>
            <Info size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Status Highlight Card */}
        <View style={appStyles.statusCard}>
          <View style={appStyles.statusIconContainer}>
            <Building2 size={24} color={colors.onPrimary} />
          </View>
          <View style={appStyles.statusContent}>
            <Text style={appStyles.statusLabel}>Clínica Ativa</Text>
            <Text style={appStyles.statusValue}>{clinic?.name || 'Carregando...'}</Text>
          </View>
          <View style={appStyles.activeBadge}>
            <View style={appStyles.pulseDot} />
            <Text style={appStyles.activeBadgeText}>Live</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={appStyles.sectionTitle}>Identificação</Text>
          
          <View style={appStyles.dashboardCard}>
            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>Nome Comercial</Text>
              <View style={[appStyles.inputFrameCompact, focusedField === 'name' && appStyles.inputFrameFocused]}>
                <Building2 size={18} color={focusedField === 'name' ? colors.primary : colors.muted} />
                <TextInput
                  style={appStyles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Clínica NutriVida"
                  placeholderTextColor={colors.muted}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>Telefone de Contato</Text>
              <View style={[appStyles.inputFrameCompact, focusedField === 'phone' && appStyles.inputFrameFocused]}>
                <Phone size={18} color={focusedField === 'phone' ? colors.primary : colors.muted} />
                <TextInput
                  style={appStyles.input}
                  value={phone}
                  onChangeText={(text) => setPhone(maskPhone(text))}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor={colors.muted}
                  keyboardType="phone-pad"
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={appStyles.sectionTitle}>Localização (Breve)</Text>
          <View style={[appStyles.dashboardCard, styles.disabledCard]}>
            <View style={styles.rowItem}>
              <MapPin size={18} color={colors.muted} />
              <Text style={styles.disabledText}>Endereço físico não configurado</Text>
            </View>
            <View style={styles.rowItem}>
              <Globe size={18} color={colors.muted} />
              <Text style={styles.disabledText}>Website ou Link social</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[appStyles.buttonCompact, appStyles.primaryButton, isSaving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Save size={18} color={colors.onPrimary} />
              <Text style={appStyles.primaryButtonText}>Salvar Alterações</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.footerSection}>
          <TouchableOpacity
            style={appStyles.dashboardCard}
            onPress={() => router.push('/clinic-audit')}
          >
            <View style={appStyles.row}>
              <View style={styles.auditIconContainer}>
                <History size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.auditTitle}>Logs de Auditoria</Text>
                <Text style={styles.auditSubtitle}>Histórico de alterações da clínica</Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { padding: spacing.md, paddingBottom: spacing.xl },
  section: { marginBottom: spacing.lg },
  disabledCard: {
    backgroundColor: colors.background,
    borderColor: colors.border + '55',
    borderStyle: 'dashed',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    opacity: 0.6
  },
  disabledText: {
    color: colors.muted,
    fontSize: fontSize.sm,
    fontStyle: 'italic'
  },
  saveBtnDisabled: { opacity: 0.7 },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.danger + '15',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '600' },
  footerSection: { marginTop: spacing.xl },
  auditIconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
  },
  auditTitle: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  auditSubtitle: { color: colors.muted, fontSize: fontSize.xs, marginTop: 1 },
});
