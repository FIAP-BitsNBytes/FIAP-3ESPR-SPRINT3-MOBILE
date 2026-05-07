import {
  ALL_TAB_ROUTES,
  getHiddenTabRoutes,
  getTabMenuForRole,
} from '../tabs';

describe('role based tab menu', () => {
  it('returns patient tabs focused on self care', () => {
    expect(getTabMenuForRole('PATIENT').map(item => item.route)).toEqual([
      'home',
      'nutrition',
      'progress',
      'schedule',
      'profile',
    ]);
  });

  it('returns nutritionist tabs focused on patient operations', () => {
    expect(getTabMenuForRole('NUTRITIONIST').map(item => item.route)).toEqual([
      'home',
      'patients',
      'ranking',
      'schedule',
      'profile',
    ]);
  });

  it('returns admin tabs focused on clinic governance', () => {
    expect(getTabMenuForRole('ADMIN').map(item => item.route)).toEqual([
      'home',
      'nutritionists',
      'clinic-settings',
      'schedule',
      'profile',
    ]);
  });

  it('hides all routes not available to a role', () => {
    const hiddenForPatient = getHiddenTabRoutes('PATIENT');

    expect(hiddenForPatient).toContain('patients');
    expect(hiddenForPatient).toContain('nutritionists');
    expect(hiddenForPatient).not.toContain('nutrition');
    expect(hiddenForPatient.length).toBe(ALL_TAB_ROUTES.length - 5);
  });
});
