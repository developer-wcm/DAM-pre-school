import { getAuthRedirectTarget } from '../auth-routing';

describe('getAuthRedirectTarget', () => {
  it('routes principals directly to the dashboard even when not approved', () => {
    expect(
      getAuthRedirectTarget({
        role: 'principal',
        approved: false,
      })
    ).toBe('/(dashboard)');
  });

  it('routes admins directly to the dashboard even when not approved', () => {
    expect(
      getAuthRedirectTarget({
        role: 'admin',
        approved: false,
      })
    ).toBe('/(dashboard)');
  });

  it('routes parents to the approval pending page when they are not approved', () => {
    expect(
      getAuthRedirectTarget({
        role: 'parent',
        approved: false,
      })
    ).toBe('/account-pending');
  });

  it('routes approved teachers to the verification screen', () => {
    expect(
      getAuthRedirectTarget({
        role: 'teacher',
        approved: true,
      })
    ).toBe('/enter-code');
  });
});
