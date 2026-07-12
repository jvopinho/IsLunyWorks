export interface UserSessionPayload {
  id: string;
  name?: string | null;
  email?: string | null;
  role?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
}

/**
 * Checks if a user has a specific permission key or is an Administrator.
 * 
 * @param user The session user object.
 * @param permissionKey The permission key to check (e.g., 'reports.view').
 * @returns boolean indicating if the user has access.
 */
export function hasPermission(
  user: UserSessionPayload | undefined | null,
  permissionKey: string
): boolean {
  if (!user || !user.role) return false;

  // Administrators have access to everything, either by role name or if they have the 'admin' permission key
  if (user.role.name === 'Administrador' || user.role.permissions.includes('admin')) {
    return true;
  }

  return user.role.permissions.includes(permissionKey);
}

// Alias to align with user prompt requirements
export const can = hasPermission;
