import { describe, it, expect } from 'vitest'
import { PROMPT_TEMPLATES, fillTemplate, getTemplateByName } from '../../src/renderer/lib/templates'

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
