export type AuditSeverity = 'info' | 'warning' | 'critical'
export type AuditStatus = 'success' | 'failure' | 'denied'

export interface AuditActor {
  userId?: string
  email?: string
  role?: string
  sessionId?: string
}

export interface AuditEvent {
  id: string
  type:
    | 'auth.login'
    | 'auth.logout'
    | 'auth.password_change'
    | 'auth.login_failed'
    | 'user.create'
    | 'user.update_role'
    | 'user.enable'
    | 'user.disable'
    | 'user.reset_password'
    | 'permission.denied'
    | 'mcp.denied'
    | 'mcp.allowed'
    | 'run.create'
    | 'workflow.create'
    | 'workflow.save'
    | 'security.exception'
    | 'export'
    | 'admin.operation'
    | 'workflow.acl.update'
    | 'provider.secret_stored'
    | 'provider.secret_migrated'
    | 'provider.secret_unreadable'
    | 'provider.connection_test'
    | 'provider.active_switch'
    | 'auth.session_restored'
    | 'auth.session_restore_unavailable'
  action: string
  status: AuditStatus
  severity: AuditSeverity
  actor: AuditActor
  resource?: {
    type: string
    id?: string
    label?: string
  }
  metadata?: Record<string, unknown>
  retentionUntil?: string
  previousHash?: string
  hash?: string
  chainVersion?: 1
  createdAt: string
}

export interface AuditIntegrityReport {
  ok: boolean
  checked: number
  firstBrokenEventId?: string
  lastHash?: string
  generatedAt: string
}

export interface AuditExportManifest {
  version: 1
  exportedAt: string
  eventCount: number
  chainHeadHash: string
  integrityOk: boolean
  integrityHash: string
  checkpoint: string
  hashAlgorithm: 'sha256'
  manifestHash: string
}

export interface AuditQuery {
  type?: string
  status?: AuditStatus
  severity?: AuditSeverity
  actorUserId?: string
  search?: string
  limit?: number
}
