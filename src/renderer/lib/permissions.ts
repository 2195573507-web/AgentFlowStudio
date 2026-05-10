import type { SessionUser, UserRole } from '../../shared/authTypes';

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

export function hasPermission(user: SessionUser | null | undefined, permission: Permission): boolean {
  return Boolean(user?.permissions.includes(permission));
}

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return user?.role === 'admin';
}

export function roleLabel(role: UserRole): string {
  return role === 'admin' ? 'Admin' : 'User';
}

