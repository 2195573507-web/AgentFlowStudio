import { expect, test } from 'playwright/test'

test.describe('AgentFlow Studio React web entry', () => {
  test.beforeEach(async ({ page }) => {
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    const networkFailures: string[] = []

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
    await expect(page.locator('main').getByRole('heading', { name: /仪表|Dashboard/ })).toBeVisible()
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

    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.getByRole('link', { name: /Dashboard/ })).toBeVisible()
    await expect.poll(() => page.evaluate(() => localStorage.getItem('agentflow.theme'))).toBe('light')
  })

  test('opens Prompt Lab and generates a redacted prompt', async ({ page }) => {
    await page.getByRole('link', { name: /提示词|Prompt Lab/ }).first().click()
    await expect(page).toHaveURL(/prompts|prompt-lab/)
    await page.getByRole('button', { name: /Generate|生成/ }).first().click()
    await expect(page.getByText(/\[Shared Memory Context\]|Build|实现|分析/).first()).toBeVisible()
  })

  test('records a safe Agent run on project detail', async ({ page }) => {
    await page.evaluate(() => {
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
      const runs: Array<Record<string, string>> = []
      Object.defineProperty(window, 'agentflow', {
        configurable: true,
        value: {
        projects: {
          get: async () => project,
        },
        tasks: {
          list: async () => [],
        },
        memory: {
          list: async () => [],
        },
        runs: {
          list: async () => runs,
          create: async (run: Record<string, string>) => {
            const created = { ...run, id: `run-${runs.length + 1}` }
            runs.unshift(created)
            return created
          },
        },
        },
      })
    })

    await page.goto('/#/projects/demo-1', { waitUntil: 'networkidle' })
    await expect(page).toHaveURL(/#\/projects\/demo-1/)
    const panel = page.getByTestId('agent-run-panel')
    await expect(panel.getByRole('heading', { name: 'Agent 执行记录' })).toBeVisible()
    await expect(panel.getByText('不会执行任何命令')).toBeVisible()

    await panel.getByLabel('执行标题').fill('E2E Agent 运行记录')
    await panel.getByLabel('工具').selectOption('Codex')
    await panel.getByLabel('状态').selectOption('success')
    await panel.getByLabel('结果摘要').fill('浏览器测试保存了一条本地执行记录。')
    await panel.getByLabel('关键日志').fill('npm.cmd run test:e2e passed for run panel.')
    await panel.getByRole('button', { name: '保存执行记录' }).click()

    await expect(panel.getByText('执行记录已保存')).toBeVisible()
    const savedRun = panel.getByRole('article').filter({ hasText: 'E2E Agent 运行记录' })
    await expect(savedRun.getByRole('heading', { name: 'E2E Agent 运行记录' })).toBeVisible()
    await expect(savedRun.getByText('已完成')).toBeVisible()
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
