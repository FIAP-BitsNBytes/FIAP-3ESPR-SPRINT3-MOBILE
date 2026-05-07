import type { UserRole } from '@/features/auth/domain/auth';
import type { AppointmentItem } from '@/features/calendar/hooks/useAppointments';

export const APPOINTMENT_DURATION_MINUTES = 60;

export interface PermissionDashboardProfile {
  role: UserRole;
  title: string;
  subtitle: string;
  primaryEntityLabel: string;
  operationsLabel: string;
}

const DASHBOARD_PROFILE_BY_ROLE: Record<UserRole, PermissionDashboardProfile> = {
  ADMIN: {
    role: 'ADMIN',
    title: 'Painel Admin',
    subtitle: 'Visao geral da operacao da clinica',
    primaryEntityLabel: 'Clinica',
    operationsLabel: 'Governanca',
  },
  NUTRITIONIST: {
    role: 'NUTRITIONIST',
    title: 'Painel do Nutricionista',
    subtitle: 'Acompanhe pacientes, alertas e agenda',
    primaryEntityLabel: 'Pacientes',
    operationsLabel: 'Atendimento',
  },
  PATIENT: {
    role: 'PATIENT',
    title: 'Meu Painel',
    subtitle: 'Acompanhe sua rotina e progresso nutricional',
    primaryEntityLabel: 'Progresso',
    operationsLabel: 'Tratamento',
  },
};

export const getPermissionDashboardProfile = (role: UserRole): PermissionDashboardProfile =>
  DASHBOARD_PROFILE_BY_ROLE[role];

export const isAppointmentActive = (
  appointment: AppointmentItem,
  now: Date,
  durationMinutes = APPOINTMENT_DURATION_MINUTES,
): boolean => {
  if (appointment.status === 'CANCELLED') return false;

  const start = new Date(appointment.scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return now >= start && now <= end;
};

export const getActiveAppointments = (
  appointments: AppointmentItem[],
  now: Date,
  durationMinutes = APPOINTMENT_DURATION_MINUTES,
): AppointmentItem[] =>
  appointments
    .filter(appointment => isAppointmentActive(appointment, now, durationMinutes))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

export const getNextAppointment = (
  appointments: AppointmentItem[],
  now: Date,
): AppointmentItem | undefined =>
  appointments
    .filter(appointment => appointment.status !== 'CANCELLED' && new Date(appointment.scheduledAt) > now)
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

export const getConfirmedAppointmentsForDay = (
  appointments: AppointmentItem[],
  day: Date,
): number =>
  appointments.filter(appointment => {
    const scheduledAt = new Date(appointment.scheduledAt);
    return appointment.status === 'CONFIRMED' && scheduledAt.toDateString() === day.toDateString();
  }).length;
