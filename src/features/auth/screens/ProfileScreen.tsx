import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, User as UserIcon, Phone, Save, CreditCard, Mail, Building, Trophy, Stethoscope, Pencil, X } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow, appStyles } from '@/shared/theme';
import { useAuthContext } from '../context/AuthContext';
import { useProfileUpdate } from '../hooks/useProfileUpdate';
import { useGamification } from '@/shared/hooks/useGamification';
import { useState, useEffect } from 'react';
import { maskCPF, maskPhone, normalizeToDigits } from '@/shared/utils/format';
import { supabase } from '@/shared/infrastructure/supabase/client';

const ROLE_LABEL = { PATIENT: 'Paciente', NUTRITIONIST: 'Nutricionista', ADMIN: 'Administrador' };
const ROLE_COLOR = { PATIENT: colors.primary, NUTRITIONIST: colors.success, ADMIN: colors.warning };

export function ProfileScreen() {
  const { user, logout } = useAuthContext();
  const { updateProfile, isSaving } = useProfileUpdate();
  const { stats, isLoading: gamLoading } = useGamification(user?.role === 'PATIENT' ? undefined : null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [crmCrn, setCrmCrn] = useState<string | null>(null);

  // States to hide placeholder on focus
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isEditing) {
      setName(user.name || '');
      setPhone(user.phone ? maskPhone(user.phone) : '');
      setCpf(user.cpf ? maskCPF(user.cpf) : '');
    }
  }, [user?.id, user?.name, user?.phone, user?.cpf, isEditing]);

  useEffect(() => {
    let cancelled = false;

    const fetchCrmCrn = async () => {
      if (user?.role !== 'NUTRITIONIST') {
        setCrmCrn(null);
        return;
      }

      const { data } = await supabase
        .from('nutritionist_details')
        .select('crm_crn')
        .eq('id', user.id)
        .maybeSingle();

      if (!cancelled) setCrmCrn(data?.crm_crn ?? null);
    };

    fetchCrmCrn();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.role]);

  if (!user) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }
    const result = await updateProfile({
      name,
      phone: normalizeToDigits(phone),
      cpf: normalizeToDigits(cpf)
    });

    if (!result.success) {
      Alert.alert('Erro', result.error || 'Não foi possível atualizar o perfil.');
      return;
    }

    Alert.alert('Sucesso', 'Perfil atualizado!');
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(user.name || '');
    setPhone(user.phone ? maskPhone(user.phone) : '');
    setCpf(user.cpf ? maskCPF(user.cpf) : '');
    setIsEditing(false);
  };

  const roleColor = ROLE_COLOR[user.role];
  const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const isCpfLocked = !!user.cpf;
  const isPatient = user.role === 'PATIENT';
  const isNutritionist = user.role === 'NUTRITIONIST';

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '22', borderColor: roleColor + '55' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABEL[user.role]}</Text>
        </View>

        {/* Dynamic Status Card Pattern */}
        <View style={[appStyles.statusCard, { marginBottom: spacing.sm }]}>
          <View style={appStyles.statusIconContainer}>
            <Building size={24} color={colors.onPrimary} />
          </View>
          <View style={appStyles.statusContent}>
            <Text style={appStyles.statusLabel}>{isPatient ? 'Pontuação' : 'Unidade Ativa'}</Text>
            <Text style={appStyles.statusValue}>
              {isPatient ? (gamLoading ? '...' : `${stats.points} pts`) : (user.clinicName || 'Sem Clínica')}
            </Text>
          </View>
          {isPatient && (
            <View style={appStyles.activeBadge}>
              <Trophy size={10} color={colors.onPrimary} />
              <Text style={appStyles.activeBadgeText}>Nível 1</Text>
            </View>
          )}
        </View>

        <View style={styles.form}>
          <Text style={appStyles.sectionTitle}>Dados de Acesso</Text>
          <View style={appStyles.dashboardCard}>
            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>E-mail (Permanente)</Text>
              <View style={[appStyles.inputFrameCompact, styles.readonlyInput]}>
                <Mail size={18} color={colors.muted} />
                <TextInput style={[appStyles.input, { color: colors.muted }]} value={user.email} editable={false} />
              </View>
            </View>

            {isNutritionist && (
              <View style={appStyles.formGroup}>
                <Text style={appStyles.fieldLabel}>CRM/CRN</Text>
                <View style={[appStyles.inputFrameCompact, styles.readonlyInput]}>
                  <Stethoscope size={18} color={colors.muted} />
                  <TextInput
                    style={[appStyles.input, { color: colors.muted }]}
                    value={crmCrn || 'Não informado'}
                    editable={false}
                  />
                </View>
              </View>
            )}
          </View>

          <Text style={appStyles.sectionTitle}>Identificação Pessoal</Text>
          <View style={appStyles.dashboardCard}>
            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>Nome Completo</Text>
              <View style={[appStyles.inputFrameCompact, !isEditing && styles.readonlyInput, focusedField === 'name' && appStyles.inputFrameFocused]}>
                <UserIcon size={18} color={focusedField === 'name' ? colors.primary : colors.muted} />
                <TextInput 
                  style={[appStyles.input, !isEditing && { color: colors.textSecondary }]} 
                  value={name} 
                  onChangeText={setName} 
                  placeholder="Seu nome" 
                  editable={isEditing}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>CPF {isCpfLocked && '(Definido)'}</Text>
              <View style={[appStyles.inputFrameCompact, (isCpfLocked || !isEditing) && styles.readonlyInput, !isCpfLocked && isEditing && focusedField === 'cpf' && appStyles.inputFrameFocused]}>
                <CreditCard size={18} color={!isCpfLocked && focusedField === 'cpf' ? colors.primary : colors.muted} />
                <TextInput 
                  style={[appStyles.input, (isCpfLocked || !isEditing) && { color: colors.textSecondary }]} 
                  value={cpf} 
                  onChangeText={(text) => setCpf(maskCPF(text))} 
                  placeholder="000.000.000-00" 
                  editable={isEditing && !isCpfLocked}
                  keyboardType="numeric"
                  onFocus={() => setFocusedField('cpf')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={appStyles.formGroup}>
              <Text style={appStyles.fieldLabel}>Telefone</Text>
              <View style={[appStyles.inputFrameCompact, !isEditing && styles.readonlyInput, focusedField === 'phone' && appStyles.inputFrameFocused]}>
                <Phone size={18} color={focusedField === 'phone' ? colors.primary : colors.muted} />
                <TextInput 
                  style={[appStyles.input, !isEditing && { color: colors.textSecondary }]} 
                  value={phone} 
                  onChangeText={(text) => setPhone(maskPhone(text))} 
                  placeholder="(00) 00000-0000" 
                  editable={isEditing}
                  keyboardType="phone-pad" 
                  onFocus={() => setFocusedField('phone')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>
          </View>

          {!isEditing ? (
            <TouchableOpacity
              style={[appStyles.buttonCompact, styles.editBtn]}
              onPress={() => setIsEditing(true)}
            >
              <Pencil size={18} color={colors.primary} />
              <Text style={styles.editText}>Editar Perfil</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[appStyles.buttonCompact, styles.cancelBtn, isSaving && styles.btnDisabled]}
                onPress={handleCancel}
                disabled={isSaving}
              >
                <X size={18} color={colors.textSecondary} />
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

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
                    <Text style={appStyles.primaryButtonText}>Salvar</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.divider} />
        
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
        >
          <LogOut size={20} color={colors.danger} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, alignItems: 'center', paddingBottom: spacing.xl },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  initials: { color: colors.primary, fontSize: fontSize.xl, fontWeight: '800' },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    marginBottom: spacing.xs,
  },
  roleText: { fontSize: fontSize.xs, fontWeight: '600' },
  form: { width: '100%', gap: spacing.md },
  readonlyInput: { backgroundColor: colors.background, borderColor: colors.border + '55' },
  editBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  editText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '700' },
  editActions: { flexDirection: 'row', gap: spacing.sm },
  saveBtnDisabled: { opacity: 0.7 },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  divider: { height: 1, backgroundColor: colors.border, alignSelf: 'stretch', marginVertical: spacing.sm },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.danger + '11',
    borderRadius: radius.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '33',
  },
  logoutText: { color: colors.danger, fontSize: fontSize.sm, fontWeight: '600' },
});
