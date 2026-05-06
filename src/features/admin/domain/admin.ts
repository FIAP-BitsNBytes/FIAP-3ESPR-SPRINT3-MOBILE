export interface AdminStats {
  totalPatients: number;
  totalNutritionists: number;
  activeSubscriptions: number;
}

export type NutritionistStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface NutritionistRequest {
  id: string;
  name: string;
  crmCrn: string;
  status: NutritionistStatus;
}
