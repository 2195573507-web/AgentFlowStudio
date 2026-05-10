import crypto from 'node:crypto';
import type {
  AuthSession,
  CreateUserRequest,
  PublicUser,
  SessionUser,
  StoredAuthUser,
  UserRole,
  UserStatus,
} from './authTypes.js';

const DEFAULT_ADMIN_EMAIL = '123@admin.com';
const DEFAULT_ADMIN_PASSWORD = '123456';
const DEFAULT_ADMIN_ID = 'local-admin';
const PASSWORD_ITERATIONS = 210_000;
const PASSWORD_KEY_LENGTH = 64;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MS = 1000 * 60 * 15;

export const authConfig = {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_ID,
  SESSION_TTL_MS,
  LOGIN_LOCK_THRESHOLD,
  LOGIN_LOCK_MS,
};

export function normalizeEmail(email: unknown): string {
  return String(email ?? '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidRole(role: unknown): role is UserRole {
  return role === 'admin' || role === 'user';
}

export function assertStrongEnoughPassword(password: string): void {
  if (password.length < 6) throw new Error('Password must be at least 6 characters.');
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  assertStrongEnoughPassword(password);
  const hash = crypto.pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, 'sha512').toString('hex');
  return {
    passwordHash: hash,
    passwordSalt: salt,
    passwordIterations: PASSWORD_ITERATIONS,
    passwordDigest: 'sha512' as const,
  };
}

export function verifyPassword(password: string, user: Pick<StoredAuthUser, 'passwordHash' | 'passwordSalt' | 'passwordIterations' | 'passwordDigest'>): boolean {
  if (user.passwordDigest !== 'sha512') return false;
  const attempted = crypto.pbkdf2Sync(password, user.passwordSalt, user.passwordIterations, PASSWORD_KEY_LENGTH, 'sha512');
  const expected = Buffer.from(user.passwordHash, 'hex');
  return expected.length === attempted.length && crypto.timingSafeEqual(expected, attempted);
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function createTemporaryPassword(): string {
  return crypto.randomBytes(18).toString('base64url');
}

export function createSession(userId: string, token = createSessionToken(), now = new Date()): { session: AuthSession; token: string } {
  const iso = now.toISOString();
  return {
    token,
    session: {
      id: crypto.randomBytes(16).toString('hex'),
      userId,
      tokenHash: hashToken(token),
      createdAt: iso,
      updatedAt: iso,
      expiresAt: new Date(now.getTime() + SESSION_TTL_MS).toISOString(),
    },
  };
}

export function isSessionActive(session: AuthSession, token: string, now = new Date()): boolean {
  if (session.revokedAt) return false;
  if (new Date(session.expiresAt).getTime() <= now.getTime()) return false;
  return session.tokenHash === hashToken(token);
}

export function toPublicUser(user: StoredAuthUser): PublicUser {
  const {
    passwordHash: _passwordHash,
    passwordSalt: _passwordSalt,
    passwordIterations: _passwordIterations,
    passwordDigest: _passwordDigest,
    ...safe
  } = user;
  return safe;
}

export function toSessionUser(user: StoredAuthUser, permissions: string[]): SessionUser {
  return { ...toPublicUser(user), permissions };
}

export function createDefaultAdmin(now = new Date()): StoredAuthUser {
  const iso = now.toISOString();
  return {
    id: DEFAULT_ADMIN_ID,
    email: DEFAULT_ADMIN_EMAIL,
    role: 'admin',
    status: 'active',
    profile: {
      displayName: 'Local Administrator',
      title: 'Workspace Admin',
      avatarColor: 'accent',
    },
    mustChangePassword: true,
    failedLoginCount: 0,
    createdAt: iso,
    updatedAt: iso,
    ...hashPassword(DEFAULT_ADMIN_PASSWORD),
  };
}

export function validateUserStatus(status: unknown): status is UserStatus {
  return status === 'active' || status === 'disabled';
}

export function createUserFromRequest(request: CreateUserRequest, now = new Date()): StoredAuthUser {
  const email = normalizeEmail(request.email);
  if (!isValidEmail(email)) throw new Error('Invalid email address.');
  if (!isValidRole(request.role)) throw new Error('Invalid user role.');
  assertStrongEnoughPassword(request.password);
  const iso = now.toISOString();
  return {
    id: crypto.randomBytes(16).toString('hex'),
    email,
    role: request.role,
    status: 'active',
    profile: {
      displayName: request.displayName?.trim() || email,
      avatarColor: request.role === 'admin' ? 'accent' : 'slate',
    },
    mustChangePassword: true,
    failedLoginCount: 0,
    createdAt: iso,
    updatedAt: iso,
    ...hashPassword(request.password),
  };
}

export function getLockUntil(failedLoginCount: number, now = new Date()): string | undefined {
  if (failedLoginCount + 1 < LOGIN_LOCK_THRESHOLD) return undefined;
  return new Date(now.getTime() + LOGIN_LOCK_MS).toISOString();
}
