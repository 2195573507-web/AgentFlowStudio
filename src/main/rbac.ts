import type { UserRole } from '../shared/authTypes.js';

export type Permission =
  | 'app:read'
  | 'project:read'
  | 'project:write'
  | 'task:write'
  | 'prompt:write'
  | 'run:write'
  | 'memory:read'
  | 'memory:write'
  | 'memory:export'
  | 'provider:read'
  | 'provider:write'
  | 'git:read'
  | 'skill:read'
  | 'export:write'
  | 'settings:read'
  | 'settings:write'
  | 'dialog:open'
  | 'admin:users'
  | 'admin:audit';

const USER_PERMISSIONS: Permission[] = [
  'app:read',
  'project:read',
  'project:write',
  'task:write',
  'prompt:write',
  'run:write',
  'memory:read',
  'memory:write',
  'memory:export',
  'provider:read',
  'git:read',
  'skill:read',
  'export:write',
  'settings:read',
  'settings:write',
  'dialog:open',
];

const ADMIN_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  'provider:write',
  'admin:users',
  'admin:audit',
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: USER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
};

export function isValidRole(role: unknown): role is UserRole {
  return role === 'admin' || role === 'user';
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function canRole(role: UserRole, permission: Permission): boolean {
  return getPermissionsForRole(role).includes(permission);
}

export function assertPermission(role: UserRole, permission: Permission): void {
  if (!canRole(role, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
}

