import { describe, expect, it } from 'vitest'
import { FONT_MONO, FONT_SANS_CN } from '../../src/shared/typography'

describe('KaiTi typography tokens', () => {
  it('defines a global Chinese KaiTi stack and monospace fallback stack', () => {
    expect(FONT_SANS_CN).toBe('KaiTi, STKaiti, "楷体", "Kaiti SC", serif')
    expect(FONT_MONO).toContain('ui-monospace')
    expect(FONT_MONO).toContain('Consolas')
  })
})
