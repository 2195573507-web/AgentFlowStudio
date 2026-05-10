import { expect, test } from 'playwright/test'

test.describe('AgentFlow Studio React web entry', () => {
  test.beforeEach(async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const networkFailures: string[] = []

    await page.addInitScript(() => {
      const user = {
        id: 'e2e-user',
        email: 'e2e@example.com',
        role: 'admin',
        status: 'active',
        profile: { displayName: 'E2E User' },
        mustChangePassword: false,
        failedLoginCount: 0,
        permissions: [
          'app:read',
          'project:read',
          'project:write',
          'task:write',
          'prompt:write',
          'run:write',
          'memory:read',
          'memory:write',
          'memory:export',
          'provider:read',
          'provider:write',
          'git:read',
          'skill:read',
          'export:write',
          'settings:read',
          'settings:write',
          'dialog:open',
          'admin:users',
          'admin:audit',
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem('agentflow.auth.session', JSON.stringify({ sessionId: 'e2e-session' }))
      Object.defineProperty(window, 'agentflow', {
        configurable: true,
        value: {
          auth: {
            bootstrap: async () => ({ ok: true }),
            session: async () => ({ authenticated: true, sessionId: 'e2e-session', user }),
            logout: async () => true,
          },
          projects: { list: async () => [] },
          tasks: { list: async () => [] },
          prompts: { list: async () => [] },
          memory: { list: async () => [] },
        },
      })
    })

    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('requestfailed', (request) => {
      networkFailures.push(`${request.url()} ${request.failure()?.errorText ?? ''}`)
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      localStorage.removeItem('agentflow.language')
      localStorage.removeItem('agentflow.theme')
    })
    await page.reload({ waitUntil: 'networkidle' })

    await page.locator('body').evaluate((body, state) => {
      Object.assign(body.dataset, {
        consoleErrors: JSON.stringify(state.consoleErrors),
        pageErrors: JSON.stringify(state.pageErrors),
        networkFailures: JSON.stringify(state.networkFailures),
      })
    }, { consoleErrors, pageErrors, networkFailures })
  })

  test('loads dashboard with Liquid Glass shell', async ({ page }) => {
    await expect(page).toHaveTitle(/AgentFlow Studio/)
    await expect(page.locator('main').getByRole('heading', { name: /仪表板|Dashboard/ })).toBeVisible()
    await expect(page.getByRole('navigation')).toBeVisible()
    await expect(page.getByText('下一步')).toBeVisible()
    for (const label of ['Idea', 'Plan', 'Tasks', 'Prompt', 'Safety', 'Logs', 'Memory', 'Handoff']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible()
    }

    const sidebarBackdrop = await page.locator('aside').evaluate((el) => getComputedStyle(el).backdropFilter)
    expect(sidebarBackdrop).toContain('blur')
    const glassShadow = await page.locator('.liquid-glass-card').first().evaluate((el) => getComputedStyle(el).boxShadow)
    expect(glassShadow).not.toBe('none')
  })

  test('navigates through core pages', async ({ page }) => {
    const pages = [
      { name: /项目|Projects/, url: /projects/ },
      { name: /提示词|Prompt Lab/, url: /prompts|prompt-lab/ },
      { name: /日志|Log Analyzer/, url: /logs|log-analyzer/ },
      { name: /安全|SafetyBox/, url: /safety|safety-box/ },
      { name: /共享记忆|Shared Memory Hub/, url: /memory|shared-memory-hub/ },
      { name: /技能|Skills/, url: /skills/ },
      { name: /Git/, url: /git|git-timeline/ },
      { name: /设置|Settings/, url: /settings/ },
    ]

    for (const entry of pages) {
      await page.getByRole('link', { name: entry.name }).first().click()
      await expect(page).toHaveURL(entry.url)
      await expect(page.locator('main')).not.toBeEmpty()
    }
  })

  test('dashboard quick actions use primary routes', async ({ page }) => {
    const quickActions = [
      { name: '提示词实验室', url: /\/prompts$/ },
      { name: '日志分析', url: /\/logs$/ },
      { name: '安全检查', url: /\/safety$/ },
      { name: '共享记忆中心', url: /\/memory$/ },
    ]

    for (const action of quickActions) {
      await page.goto('/', { waitUntil: 'networkidle' })
      await page.getByRole('button', { name: `打开${action.name}` }).click()
      await expect(page).toHaveURL(action.url)
      await expect(page.locator('main')).not.toBeEmpty()
    }
  })

  test('persists language and theme preferences', async ({ page }) => {
    await page.getByRole('button', { name: /English|中文/ }).click()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('agentflow.language'))).toBe('en')
    await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible()

    await page.locator('header button[title*="主题"], header button[title*="Theme"]').last().click()
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('agentflow.theme')))
      .toBe('light')

    await page.goto('/#/prompts', { waitUntil: 'networkidle' })
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/#\/prompts/)
    await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('agentflow.theme'))).toBe('light')
    await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe('light')
  })

  test('opens Prompt Lab and generates a redacted prompt', async ({ page }) => {
    await page.getByRole('link', { name: /提示词|Prompt Lab/ }).first().click()
    await expect(page).toHaveURL(/prompts|prompt-lab/)
    await page.getByRole('button', { name: /Generate|生成/ }).first().click()
    await expect(page.getByText(/\[Shared Memory Context\]|Build|实现|分析|下一步建议/).first()).toBeVisible()
  })

  test('shows workflow templates and prompt next actions for new users', async ({ page }) => {
    await page.goto('/#/prompts', { waitUntil: 'networkidle' })
    await expect(page.locator('main')).toContainText(/Prompt Lab/)
    for (const step of ['创建工作流', '添加节点', '配置模型/API', '运行', '查看结果和日志']) {
      await expect(page.getByText(step)).toBeVisible()
    }

    await page.getByRole('button', { name: '工作流模板' }).click()
    await page.getByPlaceholder(/搜索模板|Search/).fill('git')
    await expect(page.getByRole('heading', { name: 'Git 自动提交流程' })).toBeVisible()
    await expect(page.getByRole('heading', { name: '人工复核' })).toBeVisible()

    await page.getByRole('button', { name: 'Prompt 模板' }).click()
    await page.getByRole('button', { name: /Generate|生成 Prompt|生成/ }).first().click()
    await expect(page.getByText('下一步建议')).toBeVisible()
    await expect(page.getByRole('button', { name: '复制给 Agent' })).toBeVisible()
    await expect(page.getByRole('button', { name: '保存模板结果' })).toBeVisible()
  })

  test('opens new projects on detail with plan as the next step', async ({ page }) => {
    await page.evaluate(() => {
      const projects: Array<Record<string, string>> = []
      Object.defineProperty(window, 'agentflow', {
        configurable: true,
        value: {
          auth: {
            bootstrap: async () => ({ ok: true }),
            session: async () => ({ authenticated: true, user: { id: 'e2e-user', email: 'e2e@example.com', role: 'admin', status: 'active', profile: { displayName: 'E2E User' }, mustChangePassword: false, failedLoginCount: 0, permissions: ['app:read', 'project:read', 'project:write', 'run:write', 'memory:read', 'export:write'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }),
            logout: async () => true,
          },
          projects: {
            list: async () => projects,
            get: async (id: string) => projects.find((project) => project.id === id) ?? null,
            create: async (project: Record<string, string>) => {
              const created = {
                ...project,
                id: project.id || 'project-created-by-e2e',
                createdAt: project.createdAt || new Date().toISOString(),
                updatedAt: project.updatedAt || new Date().toISOString(),
              }
              projects.unshift(created)
              return created
            },
          },
          tasks: { list: async () => [] },
          memory: { list: async () => [] },
          runs: {
            list: async () => [],
            create: async (run: Record<string, string>) => ({ ...run, id: 'run-created-by-e2e' }),
          },
        },
      })
    })

    await page.goto('/#/projects', { waitUntil: 'networkidle' })
    await page.locator('main').getByRole('button', { name: '新建项目' }).first().click()
    await page.getByLabel('项目名称 *').fill('E2E 新手闭环项目')
    await page.getByLabel('项目描述 *').fill('验证创建后直接进入详情，并提示生成项目规划。')
    await page.getByLabel('技术栈').fill('React, Electron, TypeScript')
    await page.getByRole('button', { name: '创建项目' }).click()

    await expect(page).toHaveURL(/#\/projects\/.+\?next=plan/)
    await expect(page.getByRole('heading', { name: 'E2E 新手闭环项目' })).toBeVisible()
    const nextStep = page.getByTestId('plan-next-step')
    await expect(nextStep.getByRole('heading', { name: '下一步：生成项目规划' })).toBeVisible()
    await nextStep.getByRole('button', { name: '生成规划' }).click()
    await expect(nextStep).toBeHidden()
    await expect(page.getByRole('button', { name: '导出 Markdown' })).toBeVisible()
    await expect(page.getByRole('button', { name: '创建记忆' })).toBeVisible()
  })

  test('keeps users in the create modal when project creation returns an IPC error', async ({ page }) => {
    await page.evaluate(() => {
      Object.defineProperty(window, 'agentflow', {
        configurable: true,
        value: {
          auth: {
            bootstrap: async () => ({ ok: true }),
            session: async () => ({ authenticated: true, user: { id: 'e2e-user', email: 'e2e@example.com', role: 'admin', status: 'active', profile: { displayName: 'E2E User' }, mustChangePassword: false, failedLoginCount: 0, permissions: ['app:read', 'project:read', 'project:write'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }),
            logout: async () => true,
          },
          projects: {
            list: async () => [],
            create: async () => ({ error: 'E2E create failed' }),
          },
        },
      })
    })

    await page.goto('/#/projects', { waitUntil: 'networkidle' })
    await page.locator('main').getByRole('button', { name: '新建项目' }).first().click()
    await page.getByLabel('项目名称 *').fill('E2E 创建失败项目')
    await page.getByLabel('项目描述 *').fill('验证 IPC error 不会被当成创建成功。')
    await page.getByRole('button', { name: '创建项目' }).click()

    await expect(page).toHaveURL(/#\/projects$/)
    await expect(page.getByText('E2E create failed')).toBeVisible()
    await expect(page.getByRole('button', { name: '创建项目' })).toBeVisible()
  })

  test('records a safe Agent run on project detail', async ({ page }) => {
    await page.addInitScript(() => {
      Object.assign(window, { __e2eClipboardText: '' })
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText(value: string) {
            Object.assign(window, { __e2eClipboardText: value })
            return Promise.resolve()
          },
          readText() {
            return Promise.resolve((window as any).__e2eClipboardText)
          },
        },
      })
      const project = {
        id: 'demo-1',
        name: 'AI 聊天助手',
        idea: '验证 Project Detail 的 Agent 执行记录面板。',
        platform: 'Desktop',
        techStack: 'Electron, React, TypeScript',
        uiStyle: 'Liquid Glass',
        difficulty: 'Medium',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const exports: Array<{ content: string; filename: string }> = []
      Object.assign(window, { __agentflowExports: exports })
      const readRuns = () => JSON.parse(localStorage.getItem('__agentflowE2ERuns') || '[]') as Array<Record<string, string>>
      const writeRuns = (runs: Array<Record<string, string>>) => localStorage.setItem('__agentflowE2ERuns', JSON.stringify(runs))
      Object.defineProperty(window, 'agentflow', {
        configurable: true,
        value: {
          auth: {
            bootstrap: async () => ({ ok: true }),
            session: async () => ({ authenticated: true, user: { id: 'e2e-user', email: 'e2e@example.com', role: 'admin', status: 'active', profile: { displayName: 'E2E User' }, mustChangePassword: false, failedLoginCount: 0, permissions: ['app:read', 'project:read', 'run:write', 'memory:read', 'export:write'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } }),
            logout: async () => true,
          },
          projects: { get: async () => project },
          tasks: { list: async () => [] },
          memory: { list: async () => [] },
          runs: {
            list: async () => readRuns(),
            create: async (run: Record<string, string>) => {
              const runs = readRuns()
              const created = { ...run, id: `run-${runs.length + 1}` }
              runs.unshift(created)
              writeRuns(runs)
              return created
            },
          },
          export: {
            markdown: async (content: string, filename: string) => {
              exports.push({ content, filename })
              return 'mock-export.md'
            },
          },
        },
      })
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.evaluate(() => localStorage.removeItem('__agentflowE2ERuns'))

    await page.goto('/#/projects/demo-1', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/#\/projects\/demo-1/)
    const panel = page.getByTestId('agent-run-panel')
    await expect(panel.getByRole('heading', { name: 'Agent 执行记录' })).toBeVisible()
    await expect(panel.getByText('不会执行任何命令')).toBeVisible()

    await panel.getByLabel('执行标题').fill('E2E Agent 运行记录')
    await panel.getByLabel('工具').selectOption('Codex')
    await panel.getByLabel('状态').selectOption('success')
    await panel.getByLabel('结果摘要').fill('浏览器测试保存了一条本地执行记录。')
    await panel.getByLabel('关键日志').fill('node setup -> npm.cmd run test:e2e passed. token=sk-test-secret-1234567890')
    await panel.getByRole('button', { name: '保存执行记录' }).click()

    await expect(panel.getByText('执行记录已保存')).toBeVisible()
    const savedRun = panel.getByRole('article').filter({ hasText: 'E2E Agent 运行记录' })
    await expect(savedRun.getByRole('heading', { name: 'E2E Agent 运行记录' })).toBeVisible()
    await expect(savedRun.getByText('已完成')).toBeVisible()
    await savedRun.getByRole('button', { name: /复制日志|已复制/ }).click()
    const copiedLog = await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .not.toBe('')
      .then(() => page.evaluate(() => navigator.clipboard.readText()))
    expect(copiedLog).toContain('E2E Agent')
    expect(copiedLog).toContain('npm.cmd run test:e2e passed')
    expect(copiedLog).not.toContain('sk-test-secret-1234567890')

    await savedRun.getByRole('button', { name: '导出日志' }).click()
    const exported = await page.evaluate(() => (window as any).__agentflowExports[0])
    expect(exported.filename).toMatch(/\.md$/)
    expect(exported.content).toContain('E2E Agent')
    expect(exported.content).toContain('npm.cmd run test:e2e passed')
    expect(exported.content).not.toContain('sk-test-secret-1234567890')

    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByRole('article').filter({ hasText: 'E2E Agent 运行记录' })).toBeVisible()
  })

  test('has no serious browser errors on first run', async ({ page }) => {
    const collected = await page.locator('body').evaluate((body) => ({
      consoleErrors: JSON.parse(body.dataset.consoleErrors ?? '[]'),
      pageErrors: JSON.parse(body.dataset.pageErrors ?? '[]'),
      networkFailures: JSON.parse(body.dataset.networkFailures ?? '[]'),
    }))

    expect(collected.consoleErrors).toEqual([])
    expect(collected.pageErrors).toEqual([])
    expect(collected.networkFailures).toEqual([])
  })
})
