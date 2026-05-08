import { useAuthContext } from '@/features/auth/context/AuthContext';

export interface PlanPermissions {
  canEdit: boolean;
  canLog: boolean;
  isNutritionist: boolean;
  isPatient: boolean;
}

export function usePlanPermissions(): PlanPermissions {
  const { user } = useAuthContext();
  const role = user?.role ?? 'PATIENT';
  return {
    canEdit:        role === 'NUTRITIONIST' || role === 'ADMIN',
    canLog:         role === 'PATIENT',
    isNutritionist: role === 'NUTRITIONIST' || role === 'ADMIN',
    isPatient:      role === 'PATIENT',
  };
}
