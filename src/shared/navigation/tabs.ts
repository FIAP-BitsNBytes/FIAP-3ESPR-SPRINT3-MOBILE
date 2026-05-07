import type { UserRole } from '@/features/auth/domain/auth';

export type TabRoute =
  | 'home'
  | 'nutrition'
  | 'progress'
  | 'schedule'
  | 'profile'
  | 'patients'
  | 'ranking'
  | 'nutritionists'
  | 'clinic-settings'
  | 'clinic-audit'
  | 'index';

export type TabIconKey =
  | 'home'
  | 'nutrition'
  | 'progress'
  | 'schedule'
  | 'profile'
  | 'patients'
  | 'ranking'
  | 'nutritionists'
  | 'clinic';

export interface TabMenuItem {
  route: TabRoute;
  title: string;
  icon: TabIconKey;
  accessibilityLabel: string;
}

export const ALL_TAB_ROUTES: TabRoute[] = [
  'home',
  'nutrition',
  'progress',
  'schedule',
  'profile',
  'patients',
  'ranking',
  'nutritionists',
  'clinic-settings',
  'clinic-audit',
  'index',
];

const MENU_BY_ROLE: Record<UserRole, TabMenuItem[]> = {
  PATIENT: [
    { route: 'home', title: 'Inicio', icon: 'home', accessibilityLabel: 'Inicio do paciente' },
    { route: 'nutrition', title: 'Plano', icon: 'nutrition', accessibilityLabel: 'Plano nutricional do paciente' },
    { route: 'progress', title: 'Evolucao', icon: 'progress', accessibilityLabel: 'Evolucao do paciente' },
    { route: 'schedule', title: 'Agenda', icon: 'schedule', accessibilityLabel: 'Agenda do paciente' },
    { route: 'profile', title: 'Perfil', icon: 'profile', accessibilityLabel: 'Perfil do paciente' },
  ],
  NUTRITIONIST: [
    { route: 'home', title: 'Inicio', icon: 'home', accessibilityLabel: 'Inicio do nutricionista' },
    { route: 'patients', title: 'Pacientes', icon: 'patients', accessibilityLabel: 'Pacientes do nutricionista' },
    { route: 'ranking', title: 'Ranking', icon: 'ranking', accessibilityLabel: 'Ranking de pacientes' },
    { route: 'schedule', title: 'Agenda', icon: 'schedule', accessibilityLabel: 'Agenda do nutricionista' },
    { route: 'profile', title: 'Perfil', icon: 'profile', accessibilityLabel: 'Perfil do nutricionista' },
  ],
  ADMIN: [
    { route: 'home', title: 'Painel', icon: 'home', accessibilityLabel: 'Painel administrativo' },
    { route: 'nutritionists', title: 'Equipe', icon: 'nutritionists', accessibilityLabel: 'Equipe de nutricionistas' },
    { route: 'clinic-settings', title: 'Clinica', icon: 'clinic', accessibilityLabel: 'Configuracoes da clinica' },
    { route: 'schedule', title: 'Agenda', icon: 'schedule', accessibilityLabel: 'Agenda da clinica' },
    { route: 'profile', title: 'Perfil', icon: 'profile', accessibilityLabel: 'Perfil administrativo' },
  ],
};

export const getTabMenuForRole = (role: UserRole): TabMenuItem[] => MENU_BY_ROLE[role];

export const getHiddenTabRoutes = (role: UserRole): TabRoute[] => {
  const visibleRoutes = new Set(getTabMenuForRole(role).map(item => item.route));
  return ALL_TAB_ROUTES.filter(route => !visibleRoutes.has(route));
};
