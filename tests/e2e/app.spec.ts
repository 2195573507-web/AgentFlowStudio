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

    const sidebarBackdrop = await page.locator('aside').evaluate((el) => getComputedStyle(el).backdropFilter)
    expect(sidebarBackdrop).toContain('blur')
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
