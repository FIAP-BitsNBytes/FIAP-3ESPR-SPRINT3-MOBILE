import { StyleSheet, Text, View } from 'react-native';
import { CalendarDays, Cake, IdCard, Mail, Phone, User } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import type { PatientProfile } from '../../hooks/usePatientProfile';

const FALLBACK = 'Não informado';

const formatDate = (iso: string | null): string => {
  if (!iso) return FALLBACK;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return FALLBACK;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const computeAge = (iso: string | null): number | null => {
  if (!iso) return null;
  const birth = new Date(iso);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

const formatBirth = (iso: string | null): string => {
  const base = formatDate(iso);
  if (base === FALLBACK) return base;
  const age = computeAge(iso);
  return age != null ? `${base} (${age} anos)` : base;
};

interface InfoRowProps {
  Icon: typeof Phone;
  label: string;
  value: string;
}

function InfoRow({ Icon, label, value }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon size={15} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

interface PatientInfoCardProps {
  profile: PatientProfile;
}

export function PatientInfoCard({ profile }: PatientInfoCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <User size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>{profile.name}</Text>
          <Text style={styles.subtitle}>Informações cadastrais</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <InfoRow Icon={Mail} label="Email" value={profile.email || FALLBACK} />
      <InfoRow Icon={Phone} label="Telefone" value={profile.phone || FALLBACK} />
      <InfoRow Icon={IdCard} label="CPF" value={profile.cpf || FALLBACK} />
      <InfoRow Icon={Cake} label="Nascimento" value={formatBirth(profile.birthDate)} />
      <InfoRow Icon={CalendarDays} label="Paciente desde" value={formatDate(profile.memberSince)} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerText: { flex: 1, gap: spacing.xs },
  name: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: fontSize.xs, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  infoValue: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
});
