import type { User } from '@/features/auth';

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
