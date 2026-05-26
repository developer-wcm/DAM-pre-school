export type AuthUserRole = 'admin' | 'principal' | 'teacher' | 'parent' | 'accountant' | null;

export interface AuthProfileLike {
  role: AuthUserRole;
  approved: boolean;
  code_verified?: boolean;
}

export function getAuthRedirectTarget(profile: AuthProfileLike | null): string | null {
  if (!profile) {
    return null;
  }

  const isPrivilegedRole = profile.role === 'admin' || profile.role === 'principal';

  if (isPrivilegedRole) {
    return '/(dashboard)';
  }

  if (!profile.approved) {
    return '/account-pending';
  }

  // Teachers, parents, and accountants need code verification (unless already verified)
  if (profile.role === 'teacher' || profile.role === 'parent' || profile.role === 'accountant') {
    // If code is already verified, don't redirect to enter-code
    if (profile.code_verified) {
      // For teachers, they still need to select a class
      if (profile.role === 'teacher') {
        return '/select-class';
      }
      // Parents and accountants go to their dashboards
      return null;
    }
    return '/enter-code';
  }

  return null;
}
