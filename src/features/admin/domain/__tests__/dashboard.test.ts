import {
  getActiveAppointments,
  getConfirmedAppointmentsForDay,
  getNextAppointment,
  getPermissionDashboardProfile,
} from '../dashboard';
import type { AppointmentItem } from '@/features/calendar/hooks/useAppointments';

const appointment = (
  id: string,
  scheduledAt: string,
  status: AppointmentItem['status'] = 'CONFIRMED',
): AppointmentItem => ({
  id,
  scheduledAt,
  status,
  type: 'Consulta',
  patientName: `Paciente ${id}`,
  nutritionistName: `Nutri ${id}`,
});

describe('admin dashboard domain', () => {
  const now = new Date('2026-05-07T14:30:00.000Z');

  it('selects active appointments inside the configured duration window', () => {
    const items = [
      appointment('before', '2026-05-07T12:00:00.000Z'),
      appointment('active', '2026-05-07T14:00:00.000Z'),
      appointment('cancelled', '2026-05-07T14:05:00.000Z', 'CANCELLED'),
    ];

    expect(getActiveAppointments(items, now, 60).map(item => item.id)).toEqual(['active']);
  });

  it('finds the next non-cancelled appointment after now', () => {
    const items = [
      appointment('cancelled', '2026-05-07T15:00:00.000Z', 'CANCELLED'),
      appointment('next', '2026-05-07T16:00:00.000Z', 'PENDING'),
      appointment('later', '2026-05-07T18:00:00.000Z'),
    ];

    expect(getNextAppointment(items, now)?.id).toBe('next');
  });

  it('counts confirmed appointments for the selected local day only', () => {
    const items = [
      appointment('confirmed', '2026-05-07T10:00:00.000Z'),
      appointment('pending', '2026-05-07T11:00:00.000Z', 'PENDING'),
      appointment('other-day', '2026-05-08T10:00:00.000Z'),
    ];

    expect(getConfirmedAppointmentsForDay(items, new Date('2026-05-07T09:00:00.000Z'))).toBe(1);
  });

  it('returns dashboard profile copy by permission', () => {
    expect(getPermissionDashboardProfile('ADMIN').title).toBe('Painel Admin');
    expect(getPermissionDashboardProfile('NUTRITIONIST').primaryEntityLabel).toBe('Pacientes');
    expect(getPermissionDashboardProfile('PATIENT').primaryEntityLabel).toBe('Progresso');
  });
});
