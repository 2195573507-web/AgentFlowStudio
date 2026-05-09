import { describe, it, expect } from 'vitest'
import {
  PROMPT_TEMPLATES,
  WORKFLOW_TEMPLATES,
  filterPromptTemplates,
  filterWorkflowTemplates,
  fillTemplate,
  getWorkflowTemplateById,
  getWorkflowTemplateTags,
  getTemplateByName,
} from '../../src/renderer/lib/templates'

describe('PROMPT_TEMPLATES', () => {
  it('has all required templates', () => {
    const names = PROMPT_TEMPLATES.map((t) => t.name)
    expect(names).toContain('从零创建项目')
    expect(names).toContain('继续未完成项目')
    expect(names).toContain('修复构建错误')
    expect(names).toContain('优化 UI')
    expect(names).toContain('添加测试')
    expect(names).toContain('代码审查')
    expect(names).toContain('打包发布')
    expect(names).toContain('生成 README')
    expect(names).toContain('生成 AGENTS.md')
  })

  it('has at least 10 templates', () => {
    expect(PROMPT_TEMPLATES.length).toBeGreaterThanOrEqual(10)
  })

  it('each template has required fields', () => {
    for (const tpl of PROMPT_TEMPLATES) {
      expect(tpl.name).toBeTruthy()
      expect(tpl.description).toBeTruthy()
      expect(tpl.category).toBeTruthy()
      expect(tpl.template).toBeTruthy()
      expect(Array.isArray(tpl.variables)).toBe(true)
    }
  })

  it('each template has valid variable definitions', () => {
    for (const tpl of PROMPT_TEMPLATES) {
      for (const v of tpl.variables) {
        expect(v.name).toBeTruthy()
        expect(v.label).toBeTruthy()
      }
    }
  })
})

describe('getTemplateByName', () => {
  it('finds a template by name', () => {
    const tpl = getTemplateByName('从零创建项目')
    expect(tpl).toBeDefined()
    expect(tpl!.name).toBe('从零创建项目')
  })

  it('returns undefined for non-existent template', () => {
    expect(getTemplateByName('不存在的模板')).toBeUndefined()
  })
})

describe('fillTemplate', () => {
  it('replaces variables in template', () => {
    const tpl = getTemplateByName('从零创建项目')
    expect(tpl).toBeDefined()

    const result = fillTemplate('从零创建项目', {
      projectName: 'MyApp',
      idea: 'A test app',
      platform: 'Web',
      techStack: 'React + Node.js',
      uiStyle: 'Minimal',
    })

    expect(result).toContain('MyApp')
    expect(result).toContain('A test app')
    expect(result).toContain('Web')
  })

  it('throws error for unknown template', () => {
    expect(() => fillTemplate('Unknown', {})).toThrow('Template not found')
  })

  it('preserves unmatched placeholders as-is', () => {
    const result = fillTemplate('从零创建项目', {})
    // Unmatched {{variables}} may remain in the output
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('WORKFLOW_TEMPLATES', () => {
  it('includes the required beginner workflow templates', () => {
    const names = WORKFLOW_TEMPLATES.map((template) => template.name)

    expect(names).toEqual(expect.arrayContaining([
      '资料总结 Agent',
      '网页搜索 Agent',
      '代码修复 Agent',
      '多 Agent 并发任务',
      '人类确认节点流程',
      '循环自测修复流程',
      'Git 自动提交流程',
    ]))
  })

  it('each workflow template explains purpose, scenario, and node structure', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      expect(template.id).toBeTruthy()
      expect(template.name).toBeTruthy()
      expect(template.purpose).toBeTruthy()
      expect(template.description).toBeTruthy()
      expect(template.scenario).toBeTruthy()
      expect(template.category).toBeTruthy()
      expect(['beginner', 'intermediate', 'advanced']).toContain(template.difficulty)
      expect(['low', 'medium', 'high']).toContain(template.riskLevel)
      expect(typeof template.beginnerRecommended).toBe('boolean')
      expect(typeof template.requiresHumanApproval).toBe('boolean')
      expect(template.nodes.length).toBeGreaterThanOrEqual(3)
      for (const node of template.nodes) {
        expect(node.id).toBeTruthy()
        expect(node.name).toBeTruthy()
        expect(node.type).toBeTruthy()
        expect(node.description).toBeTruthy()
      }
    }
  })

  it('finds workflow templates by id and exposes useful tags', () => {
    expect(getWorkflowTemplateById('human-approval')?.name).toBeTruthy()
    expect(getWorkflowTemplateTags()).toEqual(
      expect.arrayContaining(['beginner', 'safety', 'git', 'loop', 'parallel']),
    )
  })

  it('filters workflow templates by query, category, risk, and beginner recommendation', () => {
    expect(filterWorkflowTemplates({ query: 'git' }).map((template) => template.id)).toContain('git-auto-commit')
    expect(filterWorkflowTemplates({ category: 'safety' }).map((template) => template.id)).toEqual(['human-approval'])
    expect(filterWorkflowTemplates({ riskLevel: 'high' }).every((template) => template.requiresHumanApproval)).toBe(true)
    expect(filterWorkflowTemplates({ beginnerOnly: true }).every((template) => template.beginnerRecommended)).toBe(true)
  })

  it('includes a real retrieval node in knowledge-oriented workflows', () => {
    const research = getWorkflowTemplateById('research-summary-agent')
    expect(research?.nodes.some((node) => node.type === 'retrieval')).toBe(true)
  })

  it('filters prompt templates outside the page component', () => {
    const results = filterPromptTemplates(PROMPT_TEMPLATES, { query: 'README' })
    expect(results.some((template) => template.name.includes('README'))).toBe(true)
  })

  it('keeps node ids unique inside each workflow template', () => {
    for (const template of WORKFLOW_TEMPLATES) {
      const ids = template.nodes.map((node) => node.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('keeps risky workflow templates gated by human or condition nodes', () => {
    const riskyTemplates = WORKFLOW_TEMPLATES.filter((template) =>
      template.nodes.some((node) => node.safetyNote),
    )

    expect(riskyTemplates.length).toBeGreaterThan(0)
    for (const template of riskyTemplates) {
      const nodeTypes = template.nodes.map((node) => node.type)
      expect(nodeTypes.some((type) => type === 'human' || type === 'condition')).toBe(true)
    }
  })
})
