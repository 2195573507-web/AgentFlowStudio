import { describe, expect, it } from 'vitest'
import { canAccessProjectResource, getProjectResourceRole } from '../../src/main/rbac'
import type { Project } from '../../src/shared/types'

const baseProject: Project = {
  id: 'p1',
  ownerUserId: 'owner',
  acl: {
    ownerUserId: 'owner',
    visibility: 'shared',
    entries: [
      { userId: 'owner', role: 'owner', grantedAt: '2026-05-10T00:00:00.000Z' },
      { userId: 'viewer', role: 'viewer', grantedAt: '2026-05-10T00:00:00.000Z' },
      { userId: 'editor', role: 'editor', grantedAt: '2026-05-10T00:00:00.000Z' },
    ],
  },
  name: 'Workflow',
  idea: 'ACL test',
  platform: 'Web',
  techStack: 'TypeScript',
  uiStyle: 'Glass',
  difficulty: 'Medium',
  status: 'active',
  createdAt: '2026-05-10T00:00:00.000Z',
  updatedAt: '2026-05-10T00:00:00.000Z',
}

function ctx(userId: string, role: 'admin' | 'user' = 'user') {
  return {
    user: { id: userId, role, email: `${userId}@example.com`, status: 'active' },
    session: { id: `s-${userId}` },
  } as never
}

describe('resource scoped ACL', () => {
  it('allows viewers to read but not write workflow resources', () => {
    expect(getProjectResourceRole(ctx('viewer'), baseProject)).toBe('viewer')
    expect(canAccessProjectResource(ctx('viewer'), baseProject, 'read')).toBe(true)
    expect(canAccessProjectResource(ctx('viewer'), baseProject, 'write')).toBe(false)
  })

  it('allows editors to write but not administer shares', () => {
    expect(canAccessProjectResource(ctx('editor'), baseProject, 'write')).toBe(true)
    expect(canAccessProjectResource(ctx('editor'), baseProject, 'admin')).toBe(false)
  })

  it('requires owner-level resource access for ACL administration', () => {
    expect(canAccessProjectResource(ctx('viewer'), baseProject, 'admin')).toBe(false)
    expect(canAccessProjectResource(ctx('editor'), baseProject, 'admin')).toBe(false)
    expect(canAccessProjectResource(ctx('owner'), baseProject, 'admin')).toBe(true)
  })

  it('allows owners and admins to administer resources', () => {
    expect(canAccessProjectResource(ctx('owner'), baseProject, 'admin')).toBe(true)
    expect(canAccessProjectResource(ctx('someone', 'admin'), baseProject, 'admin')).toBe(true)
  })
})
