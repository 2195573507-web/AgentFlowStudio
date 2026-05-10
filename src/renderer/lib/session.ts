import type { AuthSessionState, SessionUser } from '../../shared/authTypes';

const SESSION_KEY = 'agentflow.auth.session';

export interface PersistedAuthSession {
  sessionId: string;
  sessionToken: string;
  expiresAt?: string;
}

export function getStoredSession(): PersistedAuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedAuthSession>;
    if (!parsed.sessionId || !parsed.sessionToken) return null;
    return {
      sessionId: parsed.sessionId,
      sessionToken: parsed.sessionToken,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export function storeSession(session: AuthSessionState): void {
  if (typeof window === 'undefined') return;
  if (!session.sessionId || !session.sessionToken) return;
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      sessionId: session.sessionId,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
    }),
  );
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function isAuthError(value: unknown): value is { error: string } {
  return Boolean(value && typeof value === 'object' && 'error' in value);
}

export function displayNameForUser(user?: SessionUser): string {
  return user?.profile.displayName || user?.email || 'Unknown user';
}

