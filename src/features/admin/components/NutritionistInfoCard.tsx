import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BadgeCheck, CalendarDays, CheckCircle, Clock, IdCard, Mail, Phone, Stethoscope, XCircle } from 'lucide-react-native';
import { colors, fontSize, radius, spacing } from '@/shared/theme';
import type { NutritionistProfile } from '../hooks/useNutritionistProfile';

const STATUS_CONFIG = {
  APPROVED: { color: colors.success, Icon: CheckCircle, label: 'Aprovado' },
  PENDING: { color: colors.warning, Icon: Clock, label: 'Pendente' },
  REJECTED: { color: colors.danger, Icon: XCircle, label: 'Rejeitado' },
} as const;

const formatDate = (iso: string | null): string => {
  if (!iso) return 'Não informado';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const FALLBACK = 'Não informado';

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

interface NutritionistInfoCardProps {
  profile: NutritionistProfile;
}

export function NutritionistInfoCard({ profile }: NutritionistInfoCardProps) {
  const status = STATUS_CONFIG[profile.status] ?? STATUS_CONFIG.PENDING;
  const { color, Icon: StatusIcon, label } = status;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Stethoscope size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name} numberOfLines={1}>{profile.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: color + '22' }]}>
            <StatusIcon size={12} color={color} />
            <Text style={[styles.statusText, { color }]}>{label}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <InfoRow Icon={BadgeCheck} label="CRM / CRN" value={profile.crmCrn} />
      <InfoRow Icon={Mail} label="Email" value={profile.email || FALLBACK} />
      <InfoRow Icon={Phone} label="Telefone" value={profile.phone || FALLBACK} />
      <InfoRow Icon={IdCard} label="CPF" value={profile.cpf || FALLBACK} />
      <InfoRow Icon={CalendarDays} label="Membro desde" value={formatDate(profile.memberSince)} />
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  statusText: { fontSize: fontSize.xs, fontWeight: '700' },
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
