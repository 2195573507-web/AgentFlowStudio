---
name: test-runner
description: Run test suites, analyze failures, and generate fix recommendations. Use when tests fail or test coverage needs improvement.
---

## Trigger

- User asks to "run tests" or "fix tests"
- CI/CD pipeline reports test failures
- New feature needs test coverage
- Before merging or releasing

## Steps

1. Run the full test suite: `npm run test`
2. If unit tests fail, analyze each failure:
   - Read the failing test and the source code it tests
   - Determine if the test expectation is wrong or the code is wrong
   - Fix the code or update the test as appropriate
3. If E2E tests fail, check:
   - Is the dev server running?
   - Are Playwright browsers installed?
   - Is the test selector still valid?
4. Re-run tests after each fix
5. Check coverage gaps and suggest additional tests
6. Update TEST_REPORT.md with results

## Checklist

- [ ] `npm run test` passes (unit tests)
- [ ] `npm run test:e2e` passes or failures are documented
- [ ] All critical paths have test coverage
- [ ] Edge cases are tested where practical
- [ ] Test descriptions are clear
- [ ] No flaky tests (pass consistently on re-run)

## Completion Criteria

- All unit tests pass
- E2E test failures are documented with reasons
- Test report is updated
- Coverage does not regress
