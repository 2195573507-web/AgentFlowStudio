# Human Simulation Test Report

Date: 2026-05-10.

## Personas

### 1. Novice Ordinary User

Scenario: user opens the app, logs in after admin creates account, creates a project, creates a workflow from template, runs it, and reads trace.

Expected result: Dashboard and Workflow page explain the next step. Workflow page shows project/template selectors, node list, run button, recent runs, trace, and version list.

Status: PASS. Playwright now covers Dashboard next-step guidance, project creation, Workflow template creation/run, Timeline / Trace display, and actionable run/export behavior.

### 2. Administrator

Scenario: admin logs in with `123@admin.com / 123456`, must change password, then manages users and audit logs.

Expected result: must-change-password gate blocks other IPC, admin pages available after password change, admin operations audited.

Status: PASS. Existing and rerun E2E tests cover admin login, admin user creation, audit visibility, logout, protected routes, and ordinary-user admin denial.

### 3. Unauthorized User

Scenario: ordinary user attempts admin/audit/MCP/config import paths.

Expected result: main process denies permissions and writes audit. Config import with MCP/skills entries is denied for non-admin.

Status: PASS for user-visible admin denial through E2E and PASS for implemented main-process guards in workflow/config paths. Additional direct IPC fuzz coverage remains recommended.

### 4. Error Recovery User

Scenario: user runs a workflow with an LLM node missing provider/model.

Expected result: run fails with reason and next step: configure Provider/API Key and model.

Status: PASS. Unit runtime tests cover actionable provider guidance, and Playwright covers project creation error recovery without losing the modal context.

## Findings and Fixes

- Finding: workflow was not first-class. Fix: added Workflow models, templates, runtime, IPC, UI route.
- Finding: memory context could bypass ACL. Fix: filtered by project access.
- Finding: ordinary user could import privileged MCP config. Fix: admin-only guard.
- Finding: config export could expose privileged metadata. Fix: role-aware export filtering.

## Remaining Human Simulation Work

- Add direct IPC fuzz/security tests for every denied ordinary-user channel.
- Add visual regression screenshots for 1024x680 and mobile after the broader mojibake cleanup pass.
- Expand diagnostics-persona testing once a dedicated Diagnostics page is added.
