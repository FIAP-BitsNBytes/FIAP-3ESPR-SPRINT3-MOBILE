import { supabase } from '@/shared/infrastructure/supabase/client';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import { useSupabaseQuery } from '@/shared/hooks/useSupabaseQuery';

export interface ClinicPatient {
  id: string;
  name: string;
  level: number;
  streakDays: number;
  points: number;
  experience: number;
}

interface ClinicPatientsData {
  patients: ClinicPatient[];
  lowEngagement: ClinicPatient[];
}

interface GamificationStatsRow {
  patient_id: string;
  level: number;
  streak_days: number;
  points: number;
  experience: number;
}

const DEFAULT_STATS = { level: 1, streak_days: 0, points: 0, experience: 0 };
const LOW_ENGAGEMENT_LIMIT = 5;
const LOW_ENGAGEMENT_STREAK_THRESHOLD = 2;
const LOW_ENGAGEMENT_POINTS_THRESHOLD = 100;

const EMPTY_DATA: ClinicPatientsData = { patients: [], lowEngagement: [] };

const fetchClinicPatients = async (clinicId: string): Promise<ClinicPatientsData> => {
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'PATIENT')
    .eq('clinic_id', clinicId)
    .order('name', { ascending: true });

  if (profilesError) throw profilesError;
  if (!profilesData) return EMPTY_DATA;

  const patientIds = profilesData.map(p => p.id);
  const statsMap = new Map<string, GamificationStatsRow>();

  if (patientIds.length > 0) {
    const { data: statsData, error: statsError } = await supabase
      .from('gamification_stats')
      .select('patient_id, level, streak_days, points, experience')
      .in('patient_id', patientIds);

    if (statsError) throw statsError;
    statsData?.forEach(s => statsMap.set(s.patient_id, s));
  }

  const patients: ClinicPatient[] = profilesData.map(row => {
    const stats = statsMap.get(row.id) ?? DEFAULT_STATS;
    return {
      id: row.id,
      name: row.name,
      level: stats.level,
      streakDays: stats.streak_days,
      points: stats.points,
      experience: stats.experience,
    };
  });

  const lowEngagement = patients
    .filter(p => p.streakDays <= LOW_ENGAGEMENT_STREAK_THRESHOLD || p.points < LOW_ENGAGEMENT_POINTS_THRESHOLD)
    .slice(0, LOW_ENGAGEMENT_LIMIT);

  return { patients, lowEngagement };
};

export const useClinicPatients = () => {
  const { user } = useAuthContext();
  const clinicId = user?.clinicId ?? null;

  const { data, isLoading, error, refresh } = useSupabaseQuery<ClinicPatientsData>({
    fetcher: async () => {
      if (!clinicId) return EMPTY_DATA;
      return fetchClinicPatients(clinicId);
    },
    enabled: Boolean(clinicId),
    channelPrefix: clinicId ? `clinic-patients-${clinicId}` : 'clinic-patients',
    realtime: clinicId
      ? [
          { table: 'gamification_stats' },
          { table: 'profiles', filter: `clinic_id=eq.${clinicId}` },
        ]
      : undefined,
    realtimeDebounceMs: 300,
    deps: [clinicId],
  });

  const result = data ?? EMPTY_DATA;

  return {
    patients: result.patients,
    totalCount: result.patients.length,
    lowEngagement: result.lowEngagement,
    isLoading,
    error,
    refresh,
  };
};
