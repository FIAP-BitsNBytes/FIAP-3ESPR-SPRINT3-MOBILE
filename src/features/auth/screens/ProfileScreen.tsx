import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { colors, spacing, radius, fontSize } from '@/shared/theme';
import { useAuthContext } from '../context/AuthContext';

const ROLE_LABEL = { PATIENT: 'Paciente', NUTRITIONIST: 'Nutricionista', ADMIN: 'Administrador' };
const ROLE_COLOR = { PATIENT: colors.primary, NUTRITIONIST: colors.success, ADMIN: colors.warning };

export function ProfileScreen() {
  const { user, logout } = useAuthContext();
  if (!user) return null;

  const roleColor = ROLE_COLOR[user.role];
  const initials = user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: roleColor + '22', borderColor: roleColor + '55' }]}>
          <Text style={[styles.roleText, { color: roleColor }]}>{ROLE_LABEL[user.role]}</Text>
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
  content: { padding: spacing.lg, gap: spacing.lg, alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '33',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  initials: { color: colors.primary, fontSize: fontSize.xxl, fontWeight: '800' },
  name: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  email: { color: colors.muted, fontSize: fontSize.md, marginTop: -spacing.sm },
  roleBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  roleText: { fontSize: fontSize.sm, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.border, alignSelf: 'stretch' },
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
