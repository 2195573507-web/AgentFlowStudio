import type { AuthSession, StoredAuthUser } from '../shared/authTypes.js';
import {
  createDefaultAdmin,
  createSession,
  createTemporaryPassword,
  authConfig,
  hashPassword,
  isSessionActive,
  normalizeEmail,
  toPublicUser,
  toSessionUser,
  verifyPassword,
  createUserFromRequest,
  getLockUntil,
  validateUserStatus,
} from './auth.js';
import storage from './storage.js';
import { getPermissionsForRole, isValidRole } from './rbac.js';
import { recordAudit } from './audit.js';
import type { CreateUserRequest, LoginRequest, ResetPasswordRequest, UpdateUserRequest } from '../shared/authTypes.js';

export interface SessionContext {
  user: StoredAuthUser;
  session: AuthSession;
}

let activeRendererSession: { sessionId: string; token: string } | null = null;

export function getActiveRendererSession(): { sessionId?: string; sessionToken?: string } {
  return {
    sessionId: activeRendererSession?.sessionId,
    sessionToken: activeRendererSession?.token,
  };
}

export function clearActiveRendererSession(sessionId?: string): void {
  if (!sessionId || activeRendererSession?.sessionId === sessionId) {
    activeRendererSession = null;
  }
}

export async function bootstrapAuth(): Promise<void> {
  const users = await storage.getAll<StoredAuthUser>('users');
  if (users.some((user) => normalizeEmail(user.email) === authConfig.DEFAULT_ADMIN_EMAIL)) return;
  const admin = createDefaultAdmin();
  await storage.create('users', admin as never);
  await recordAudit({
    type: 'security.exception',
    action: 'auth.default_admin_initialized',
    status: 'success',
    severity: 'warning',
    actor: { userId: admin.id, email: admin.email, role: admin.role },
    resource: { type: 'user', id: admin.id, label: admin.email },
    metadata: { mustChangePassword: true },
  });
}

async function findUserByEmail(email: string): Promise<StoredAuthUser | null> {
  const users = await storage.getAll<StoredAuthUser>('users');
  return users.find((user) => normalizeEmail(user.email) === normalizeEmail(email)) ?? null;
}

export async function login(request: LoginRequest) {
  await bootstrapAuth();
  const email = normalizeEmail(request.email);
  const user = await findUserByEmail(email);
  const now = new Date();

  if (!user) {
    await recordAudit({
      type: 'auth.login_failed',
      action: 'auth.login',
      status: 'failure',
      severity: 'warning',
      actor: { email },
      metadata: { reason: 'unknown_user' },
    });
    return { ok: false, error: 'Invalid email or password.' };
  }

  if (user.status !== 'active') {
    await recordAudit({
      type: 'auth.login_failed',
      action: 'auth.login',
      status: 'denied',
      severity: 'warning',
      actor: { userId: user.id, email: user.email, role: user.role },
      metadata: { reason: 'disabled_user' },
    });
    return { ok: false, error: 'This user is disabled.' };
  }

  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > now.getTime()) {
    await recordAudit({
      type: 'auth.login_failed',
      action: 'auth.login',
      status: 'denied',
      severity: 'warning',
      actor: { userId: user.id, email: user.email, role: user.role },
      metadata: { reason: 'locked', lockedUntil: user.lockedUntil },
    });
    return { ok: false, error: 'Too many failed login attempts. Try again later.', lockedUntil: user.lockedUntil };
  }

  if (!verifyPassword(request.password, user)) {
    const lockedUntil = getLockUntil(user.failedLoginCount, now);
    await storage.update('users', user.id, {
      failedLoginCount: user.failedLoginCount + 1,
      lockedUntil,
      updatedAt: now.toISOString(),
    } as never);
    await recordAudit({
      type: 'auth.login_failed',
      action: 'auth.login',
      status: lockedUntil ? 'denied' : 'failure',
      severity: lockedUntil ? 'critical' : 'warning',
      actor: { userId: user.id, email: user.email, role: user.role },
      metadata: { reason: lockedUntil ? 'lock_created' : 'bad_password', failedLoginCount: user.failedLoginCount + 1, lockedUntil },
    });
    return { ok: false, error: lockedUntil ? 'Too many failed login attempts. Account is temporarily locked.' : 'Invalid email or password.', lockedUntil };
  }

  const { session, token } = createSession(user.id, undefined, now);
  activeRendererSession = { sessionId: session.id, token };
  await storage.create('sessions', session as never);
  const updated = await storage.update('users', user.id, {
    failedLoginCount: 0,
    lockedUntil: undefined,
    lastLoginAt: now.toISOString(),
    updatedAt: now.toISOString(),
  } as never);
  const activeUser = (updated ?? user) as StoredAuthUser;
  await recordAudit({
    type: 'auth.login',
    action: 'auth.login',
    status: 'success',
    severity: 'info',
    actor: { userId: activeUser.id, email: activeUser.email, role: activeUser.role, sessionId: session.id },
    resource: { type: 'session', id: session.id },
  });
  return {
    ok: true,
    session: {
      authenticated: true,
      sessionId: session.id,
      user: toSessionUser(activeUser, getPermissionsForRole(activeUser.role)),
      expiresAt: session.expiresAt,
    },
  };
}

export async function validateSession(sessionId?: string, token?: string): Promise<SessionContext | null> {
  if (!sessionId || !token) return null;
  const session = await storage.getById<AuthSession>('sessions', sessionId);
  if (!session || !isSessionActive(session, token)) return null;
  const user = await storage.getById<StoredAuthUser>('users', session.userId);
  if (!user || user.status !== 'active') return null;
  await storage.update('sessions', session.id, { updatedAt: new Date().toISOString() } as never);
  return { user, session };
}

export async function sessionState(sessionId?: string, token?: string) {
  if (!sessionId && !token) {
    const active = getActiveRendererSession();
    sessionId = active.sessionId;
    token = active.sessionToken;
  }
  const ctx = await validateSession(sessionId, token);
  if (!ctx) return { authenticated: false };
  return {
    authenticated: true,
    sessionId: ctx.session.id,
    user: toSessionUser(ctx.user, getPermissionsForRole(ctx.user.role)),
    expiresAt: ctx.session.expiresAt,
  };
}

export async function logout(sessionId?: string, token?: string): Promise<boolean> {
  const ctx = await validateSession(sessionId, token);
  if (!ctx) return false;
  await storage.update('sessions', ctx.session.id, { revokedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as never);
  clearActiveRendererSession(ctx.session.id);
  await recordAudit({
    type: 'auth.logout',
    action: 'auth.logout',
    status: 'success',
    severity: 'info',
    actor: { userId: ctx.user.id, email: ctx.user.email, role: ctx.user.role, sessionId: ctx.session.id },
    resource: { type: 'session', id: ctx.session.id },
  });
  return true;
}

async function revokeUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
  const sessions = await storage.getAll<AuthSession>('sessions');
  const now = new Date().toISOString();
  await Promise.all(
    sessions
      .filter((session) => session.userId === userId && session.id !== exceptSessionId && !session.revokedAt)
      .map((session) => storage.update('sessions', session.id, { revokedAt: now, updatedAt: now } as never)),
  );
  if (!exceptSessionId && activeRendererSession) {
    const active = sessions.find((session) => session.id === activeRendererSession?.sessionId);
    if (active?.userId === userId) clearActiveRendererSession(active.id);
  }
}

async function assertAdminChangeIsSafe(actor: SessionContext, target: StoredAuthUser, request: UpdateUserRequest): Promise<void> {
  const disabling = request.status === 'disabled';
  const demoting = request.role === 'user' && target.role === 'admin';
  if (!disabling && !demoting) return;
  if (actor.user.id === target.id) {
    throw new Error('Admins cannot demote or disable their own account.');
  }
  const users = await storage.getAll<StoredAuthUser>('users');
  const activeAdminsAfter = users.filter((user) => {
    if (user.id === target.id) {
      const nextRole = request.role ?? user.role;
      const nextStatus = request.status ?? user.status;
      return nextRole === 'admin' && nextStatus === 'active';
    }
    return user.role === 'admin' && user.status === 'active';
  });
  if (activeAdminsAfter.length === 0) {
    throw new Error('At least one active admin must remain.');
  }
}

export async function changePassword(ctx: SessionContext, currentPassword: string, newPassword: string) {
  if (!verifyPassword(currentPassword, ctx.user)) throw new Error('Current password is incorrect.');
  const payload = {
    ...hashPassword(newPassword),
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };
  const updated = await storage.update('users', ctx.user.id, payload as never);
  await revokeUserSessions(ctx.user.id, ctx.session.id);
  await recordAudit({
    type: 'auth.password_change',
    action: 'auth.change_password',
    status: 'success',
    severity: 'info',
    actor: { userId: ctx.user.id, email: ctx.user.email, role: ctx.user.role, sessionId: ctx.session.id },
    resource: { type: 'user', id: ctx.user.id, label: ctx.user.email },
  });
  const activeUser = (updated ?? ctx.user) as StoredAuthUser;
  return toSessionUser(activeUser, getPermissionsForRole(activeUser.role));
}

export async function listUsers() {
  const users = await storage.getAll<StoredAuthUser>('users');
  return users.map(toPublicUser).sort((a, b) => a.email.localeCompare(b.email));
}

export async function createUser(ctx: SessionContext, request: CreateUserRequest) {
  const user = createUserFromRequest(request);
  const existing = await findUserByEmail(user.email);
  if (existing) throw new Error('A user with this email already exists.');
  await storage.create('users', user as never);
  await recordAudit({
    type: 'user.create',
    action: 'user.create',
    status: 'success',
    severity: 'info',
    actor: { userId: ctx.user.id, email: ctx.user.email, role: ctx.user.role, sessionId: ctx.session.id },
    resource: { type: 'user', id: user.id, label: user.email },
    metadata: { role: user.role },
  });
  return toPublicUser(user);
}

export async function updateUser(ctx: SessionContext, request: UpdateUserRequest) {
  const user = await storage.getById<StoredAuthUser>('users', request.userId);
  if (!user) throw new Error('User not found.');
  if (request.role !== undefined && !isValidRole(request.role)) throw new Error('Invalid user role.');
  if (request.status !== undefined && !validateUserStatus(request.status)) throw new Error('Invalid user status.');
  await assertAdminChangeIsSafe(ctx, user, request);
  const update: Partial<StoredAuthUser> = {
    updatedAt: new Date().toISOString(),
  };
  if (request.role !== undefined) update.role = request.role;
  if (request.status !== undefined) {
    update.status = request.status;
    update.disabledAt = request.status === 'disabled' ? new Date().toISOString() : undefined;
  }
  if (request.profile) update.profile = { ...user.profile, ...request.profile };
  const updated = await storage.update('users', user.id, update as never);
  if (request.status === 'disabled' || request.role !== undefined) {
    await revokeUserSessions(user.id, ctx.session.id);
  }
  const action = request.status === 'disabled' ? 'user.disable' : request.status === 'active' ? 'user.enable' : request.role ? 'user.update_role' : 'admin.operation';
  await recordAudit({
    type: action as never,
    action,
    status: 'success',
    severity: request.status === 'disabled' || request.role ? 'warning' : 'info',
    actor: { userId: ctx.user.id, email: ctx.user.email, role: ctx.user.role, sessionId: ctx.session.id },
    resource: { type: 'user', id: user.id, label: user.email },
    metadata: { role: request.role, status: request.status },
  });
  return toPublicUser((updated ?? user) as StoredAuthUser);
}

export async function resetPassword(ctx: SessionContext, request: ResetPasswordRequest) {
  const user = await storage.getById<StoredAuthUser>('users', request.userId);
  if (!user) throw new Error('User not found.');
  const temporaryPassword = createTemporaryPassword();
  const updated = await storage.update('users', user.id, {
    ...hashPassword(temporaryPassword),
    mustChangePassword: request.mustChangePassword ?? true,
    failedLoginCount: 0,
    lockedUntil: undefined,
    updatedAt: new Date().toISOString(),
  } as never);
  await revokeUserSessions(user.id, ctx.session.id);
  await recordAudit({
    type: 'user.reset_password',
    action: 'user.reset_password',
    status: 'success',
    severity: 'warning',
    actor: { userId: ctx.user.id, email: ctx.user.email, role: ctx.user.role, sessionId: ctx.session.id },
    resource: { type: 'user', id: user.id, label: user.email },
    metadata: { mustChangePassword: request.mustChangePassword ?? true },
  });
  return {
    user: toPublicUser((updated ?? user) as StoredAuthUser),
    temporaryPassword,
  };
}
