export type UserRole = 'admin' | 'user'
export type UserStatus = 'active' | 'disabled'

export interface AuthProfile {
  displayName: string
  title?: string
  avatarColor?: string
}

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  profile: AuthProfile
  mustChangePassword: boolean
  failedLoginCount: number
  lockedUntil?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  disabledAt?: string
}

export interface StoredAuthUser extends AuthUser {
  passwordHash: string
  passwordSalt: string
  passwordIterations: number
  passwordDigest: 'sha512'
}

export interface AuthSession {
  id: string
  userId: string
  tokenHash: string
  createdAt: string
  updatedAt: string
  expiresAt: string
  revokedAt?: string
}

export interface SessionUser extends AuthUser {
  permissions: string[]
}

export interface AuthSessionState {
  authenticated: boolean
  sessionId?: string
  sessionToken?: string
  user?: SessionUser
  expiresAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResult {
  ok: boolean
  session?: AuthSessionState
  error?: string
  lockedUntil?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface CreateUserRequest {
  email: string
  password: string
  role: UserRole
  displayName?: string
}

export interface ResetPasswordRequest {
  userId: string
  mustChangePassword?: boolean
}

export interface ResetPasswordResult {
  user: PublicUser
  temporaryPassword: string
}

export interface UpdateUserRequest {
  userId: string
  role?: UserRole
  status?: UserStatus
  profile?: Partial<AuthProfile>
}

export interface PublicUser {
  id: string
  email: string
  role: UserRole
  status: UserStatus
  profile: AuthProfile
  mustChangePassword: boolean
  failedLoginCount: number
  lockedUntil?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  disabledAt?: string
}
