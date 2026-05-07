---
name: git-release-manager
description: Manage git commits, version bumps, changelog updates, and release preparation. Use when preparing a release or managing git history.
---

## Trigger

- User asks to "create a release" or "bump version"
- Preparing for production deployment
- Need to generate changelog
- Git history needs cleanup

## Steps

1. Review current git status and recent commits
2. Determine version bump type (major/minor/patch) based on changes
3. Update version in package.json
4. Update CHANGELOG.md with new entries
5. Stage all changes: `git add -A`
6. Commit with message: `chore: bump version to X.Y.Z`
7. Create git tag: `git tag vX.Y.Z`
8. Verify build passes: `npm run build`
9. Generate release notes from commit history

## Checklist

- [ ] Version bumped correctly (semver)
- [ ] CHANGELOG.md updated
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Git tag created
- [ ] Release notes generated

## Completion Criteria

- Version is bumped in package.json
- CHANGELOG has new entry
- Git tag is created
- Build and tests pass
