import { ScrollView, View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut, User as UserIcon, Phone, Save, CreditCard, Mail, Building, Trophy } from 'lucide-react-native';
import { colors, spacing, radius, fontSize, shadow } from '@/shared/theme';
import { useAuthContext } from '../context/AuthContext';
import { useProfileUpdate } from '../hooks/useProfileUpdate';
import { useGamification } from '@/shared/hooks/useGamification';
import { useState, useEffect } from 'react';
import { maskCPF, maskPhone, normalizeToDigits } from '@/shared/utils/format';

const ROLE_LABEL = { PATIENT: 'Paciente', NUTRITIONIST: 'Nutricionista', ADMIN: 'Administrador' };
const ROLE_COLOR = { PATIENT: colors.primary, NUTRITIONIST: colors.success, ADMIN: colors.warning };

export function ProfileScreen() {
  const { user, logout } = useAuthContext();
  const { updateProfile, isSaving } = useProfileUpdate();
  const { stats, isLoading: gamLoading } = useGamification();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');

  // States to hide placeholder on focus
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone ? maskPhone(user.phone) : '');
      setCpf(user.cpf ? maskCPF(user.cpf) : '');
    }
  }, [user?.id]);

  if (!user) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }
    await updateProfile({ 
      name, 
      phone: normalizeToDigits(phone), 
      cpf: normalizeToDigits(cpf) 
    });
    Alert.alert('Sucesso', 'Perfil atualizado!');
  };

  const roleColor = ROLE_COLOR[user.role];
  const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const isCpfLocked = !!user.cpf;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '22', borderColor: roleColor + '55' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABEL[user.role]}</Text>
        </View>

        <View style={styles.gamRow}>
          <View style={styles.gamItem}>
            <Trophy size={18} color={colors.warning} />
            <Text style={styles.gamText}>{gamLoading ? '...' : `${stats.points} pts`}</Text>
          </View>
          <View style={styles.gamItem}>
            <Building size={18} color={colors.primary} />
            <Text style={styles.gamText} numberOfLines={1}>{user.clinicName || 'Sem Clínica'}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail (Não alterável)</Text>
            <View style={[styles.inputWrapper, styles.readonlyInput]}>
              <Mail size={20} color={colors.muted} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.muted }]} value={user.email} editable={false} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome Completo</Text>
            <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperFocused]}>
              <UserIcon size={20} color={focusedField === 'name' ? colors.primary : colors.muted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={name} 
                onChangeText={setName} 
                placeholder={focusedField === 'name' ? '' : 'Seu nome'} 
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF {isCpfLocked && '(Definido)'}</Text>
            <View style={[styles.inputWrapper, isCpfLocked && styles.readonlyInput, !isCpfLocked && focusedField === 'cpf' && styles.inputWrapperFocused]}>
              <CreditCard size={20} color={!isCpfLocked && focusedField === 'cpf' ? colors.primary : colors.muted} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, isCpfLocked && { color: colors.muted }]} 
                value={cpf} 
                onChangeText={(text) => setCpf(maskCPF(text))} 
                placeholder={focusedField === 'cpf' ? '' : '000.000.000-00'} 
                editable={!isCpfLocked}
                keyboardType="numeric"
                onFocus={() => setFocusedField('cpf')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefone</Text>
            <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputWrapperFocused]}>
              <Phone size={20} color={focusedField === 'phone' ? colors.primary : colors.muted} style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                value={phone} 
                onChangeText={(text) => setPhone(maskPhone(text))} 
                placeholder={focusedField === 'phone' ? '' : '(00) 00000-0000'} 
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
                <Text style={styles.saveText}>Atualizar Perfil</Text>
              </>
            )}
          </TouchableOpacity>
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
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, alignItems: 'center', paddingBottom: spacing.xxl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  initials: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '800' },
  roleBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  roleText: { fontSize: fontSize.sm, fontWeight: '600' },
  gamRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  gamItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: spacing.xs, 
    backgroundColor: colors.surface, 
    paddingHorizontal: spacing.md, 
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gamText: { color: colors.text, fontSize: fontSize.sm, fontWeight: '700' },
  form: { width: '100%', gap: spacing.lg },
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
  readonlyInput: { backgroundColor: colors.background, borderColor: colors.border + '55' },
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
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { color: colors.background, fontSize: fontSize.md, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, alignSelf: 'stretch', marginVertical: spacing.md },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.danger + '11',
    borderRadius: radius.lg,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '33',
  },
  logoutText: { color: colors.danger, fontSize: fontSize.md, fontWeight: '600' },
});
