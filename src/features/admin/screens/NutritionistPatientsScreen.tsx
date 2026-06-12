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
import { ArrowLeft, Flame, Star, Trophy, Users, Zap } from 'lucide-react-native';
import { appStyles, colors, fontSize, palette, radius, spacing } from '@/shared/theme';
import { useNutritionistPatients, type NutritionistPatient } from '../hooks/useNutritionistPatients';

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
  const { patients, isLoading, error, refresh } = useNutritionistPatients(id ?? '');

  const totalPoints = patients.reduce((sum, p) => sum + p.points, 0);

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
        refreshing={isLoading}
        onRefresh={refresh}
        ListHeaderComponent={
          <>
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
