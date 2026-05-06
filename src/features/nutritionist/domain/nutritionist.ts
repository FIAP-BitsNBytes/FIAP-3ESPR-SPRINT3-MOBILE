import type { User } from '@/features/auth';

export interface NutritionistProfile extends User {
  crmCrn: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface PatientSummary {
  id: string;
  name: string;
  level: number;
  streakDays: number;
  points: number;
}
