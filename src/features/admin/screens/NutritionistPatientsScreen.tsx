import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CalendarClock, Flame, Star, Trophy, Users, Zap } from 'lucide-react-native';
import { appStyles, colors, fontSize, palette, radius, spacing } from '@/shared/theme';
import { useNutritionistPatients, type NutritionistPatient } from '../hooks/useNutritionistPatients';
import { useNutritionistProfile } from '../hooks/useNutritionistProfile';
import { useNutritionistAppointments } from '../hooks/useNutritionistAppointments';
import { NutritionistInfoCard } from '../components/NutritionistInfoCard';
import { NutritionistSessionRow } from '../components/NutritionistSessionRow';

const MEDAL_COLORS = [palette.amber, palette.silver, palette.bronze] as const;
const LEVEL_COLORS = [palette.slate, colors.success, colors.primary, palette.violet, colors.danger] as const;

function getLevelColor(level: number): string {
  const index = Math.min(Math.floor((level - 1) / 5), LEVEL_COLORS.length - 1);
  return LEVEL_COLORS[Math.max(0, index)];
}

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    const color = MEDAL_COLORS[rank - 1];
    return (
      <View style={[styles.medalBadge, { backgroundColor: color + '22' }]}>
        <Trophy size={13} color={color} />
        <Text style={[styles.medalText, { color }]}>#{rank}</Text>
      </View>
    );
  }
  return (
    <View style={styles.rankBadge}>
      <Text style={styles.rankText}>#{rank}</Text>
    </View>
  );
}

function PatientRow({ patient, rank }: { patient: NutritionistPatient; rank: number }) {
  const levelColor = getLevelColor(patient.level);

  return (
    <View style={styles.patientCard}>
      <RankBadge rank={rank} />

      <View style={styles.patientInfo}>
        <View style={styles.patientNameRow}>
          <Text style={styles.patientName} numberOfLines={1}>{patient.name}</Text>
          <View style={[styles.levelBadge, { backgroundColor: levelColor + '22', borderColor: levelColor + '44' }]}>
            <Star size={10} color={levelColor} />
            <Text style={[styles.levelText, { color: levelColor }]}>Nv {patient.level}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Zap size={11} color={colors.warning} />
            <Text style={styles.statValue}>{patient.points.toLocaleString('pt-BR')}</Text>
            <Text style={styles.statLabel}>pts</Text>
          </View>
          <View style={styles.statChip}>
            <Flame size={11} color={colors.danger} />
            <Text style={styles.statValue}>{patient.streakDays}</Text>
            <Text style={styles.statLabel}>dias</Text>
          </View>
          <View style={styles.statChip}>
            <Star size={11} color={colors.primary} />
            <Text style={styles.statValue}>{patient.experience.toLocaleString('pt-BR')}</Text>
            <Text style={styles.statLabel}>xp</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function NutritionistPatientsScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const nutritionistId = id ?? '';
  const { patients, isLoading, error, refresh } = useNutritionistPatients(nutritionistId);
  const { profile, isLoading: isProfileLoading, refresh: refreshProfile } = useNutritionistProfile(nutritionistId);
  const { appointments, isLoading: isAppointmentsLoading, refresh: refreshAppointments } =
    useNutritionistAppointments(nutritionistId);

  const totalPoints = patients.reduce((sum, p) => sum + p.points, 0);

  const handleRefresh = () => {
    refresh();
    refreshProfile();
    refreshAppointments();
  };

  return (
    <SafeAreaView style={appStyles.screen} edges={['top']}>
      <View style={[appStyles.dashboardHeader, styles.header]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={appStyles.dashboardTitle} numberOfLines={1}>{name ?? 'Nutricionista'}</Text>
          <Text style={appStyles.dashboardSubtitle}>Pacientes e scores</Text>
        </View>
      </View>

      <FlatList
        data={patients}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading || isProfileLoading || isAppointmentsLoading}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <>
            <Text style={[appStyles.sectionTitle, styles.sectionLabel]}>Informações Pessoais</Text>
            {profile ? (
              <View style={styles.blockSpacing}>
                <NutritionistInfoCard profile={profile} />
              </View>
            ) : isProfileLoading ? (
              <View style={[styles.inlineLoader, styles.blockSpacing]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null}

            <View style={styles.sessionsHeader}>
              <CalendarClock size={16} color={colors.primary} />
              <Text style={[appStyles.sectionTitle, styles.sessionsTitle]}>Pacientes em Sessões</Text>
              {appointments.length > 0 && (
                <Text style={styles.sessionsCount}>{appointments.length}</Text>
              )}
            </View>
            {isAppointmentsLoading && appointments.length === 0 ? (
              <View style={[styles.inlineLoader, styles.blockSpacing]}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : appointments.length > 0 ? (
              <View style={[styles.sessionsList, styles.blockSpacing]}>
                {appointments.map(appointment => (
                  <NutritionistSessionRow key={appointment.id} appointment={appointment} />
                ))}
              </View>
            ) : (
              <View style={[styles.sessionsEmpty, styles.blockSpacing]}>
                <CalendarClock size={18} color={colors.muted} />
                <Text style={styles.sessionsEmptyText}>Nenhuma sessão agendada</Text>
              </View>
            )}

            <View style={[appStyles.statusCard, styles.summaryCard]}>
              <View style={appStyles.statusIconContainer}>
                <Users size={24} color={colors.onPrimary} />
              </View>
              <View style={appStyles.statusContent}>
                <Text style={appStyles.statusLabel}>Total de Pacientes</Text>
                <Text style={appStyles.statusValue}>
                  {isLoading ? '...' : `${patients.length} paciente${patients.length !== 1 ? 's' : ''}`}
                </Text>
              </View>
              {!isLoading && patients.length > 0 && (
                <View style={styles.pointsSummary}>
                  <Zap size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.pointsSummaryText}>
                    {totalPoints.toLocaleString('pt-BR')} pts
                  </Text>
                </View>
              )}
            </View>

            {patients.length > 0 && (
              <Text style={[appStyles.sectionTitle, styles.sectionLabel]}>Ranking de Pacientes</Text>
            )}
          </>
        }
        renderItem={({ item, index }) => <PatientRow patient={item} rank={index + 1} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} size="large" />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.centered}>
              <Users size={40} color={colors.muted} />
              <Text style={styles.emptyTitle}>Sem pacientes</Text>
              <Text style={styles.emptySubtitle}>
                Este nutricionista ainda não possui pacientes vinculados.
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
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
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  pointsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pointsSummaryText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  blockSpacing: {
    marginBottom: spacing.md,
  },
  inlineLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  sessionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sessionsTitle: {
    marginBottom: 0,
    flex: 1,
  },
  sessionsCount: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '800',
    backgroundColor: colors.primaryGlow,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  sessionsList: {
    gap: spacing.sm,
  },
  sessionsEmpty: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sessionsEmptyText: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
  patientCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.md,
    minWidth: 48,
    justifyContent: 'center',
  },
  medalText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
  },
  rankBadge: {
    minWidth: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  patientInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  patientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  patientName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    flex: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  centered: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.muted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
