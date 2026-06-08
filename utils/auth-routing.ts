export type AuthUserRole = 'admin' | 'principal' | 'teacher' | 'parent' | null;

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

  if (profile.role === 'teacher' || profile.role === 'parent') {
    if (profile.code_verified) {
      if (profile.role === 'teacher') {
        return '/select-class';
      }
      if (profile.role === 'parent') {
        return '/(parent)';
      }
    }
    return '/enter-code';
  }

  return null;
}
