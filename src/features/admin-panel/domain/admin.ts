import { User } from '@/features/auth/domain/auth';

export interface NutritionistRequest {
  id: string;
  name: string;
  email: string;
  crmCrn: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AdminStats {
  totalPatients: number;
  totalNutritionists: number;
  activeSubscriptions: number;
}
