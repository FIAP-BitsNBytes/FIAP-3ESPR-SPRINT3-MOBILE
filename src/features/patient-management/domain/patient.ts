import { User } from '@/features/auth/domain/auth';

export interface PatientProfile extends User {
  birthDate: string;
  weight: number;
  height: number;
  goal: string;
}

export interface PatientEvolution {
  date: string;
  weight: number;
  fatPercentage: number;
}
