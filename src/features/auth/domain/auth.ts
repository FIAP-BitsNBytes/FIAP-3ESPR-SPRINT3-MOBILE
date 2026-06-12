export type UserRole = 'PATIENT' | 'NUTRITIONIST' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  cpf?: string | null;
  role: UserRole;
  clinicId: string | null;
  clinicName?: string | null;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
