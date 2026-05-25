export type AuthUserRole = 'admin' | 'principal' | 'teacher' | 'parent' | 'accountant' | null;

export interface AuthProfileLike {
  role: AuthUserRole;
  approved: boolean;
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

  if (profile.role === 'teacher' || profile.role === 'parent' || profile.role === 'accountant') {
    return '/enter-code';
  }

  return null;
}
