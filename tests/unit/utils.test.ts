import { afterEach, describe, expect, it, vi } from 'vitest'
import { classNames, copyToClipboard, debounce } from '../../src/renderer/lib/utils'

describe('utils', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('joins class names and filters falsy values', () => {
    expect(classNames('base', false, undefined, null, 'active', 2)).toBe('base active 2')
  })

  it('debounces calls and keeps the latest arguments', () => {
    vi.useFakeTimers()
    const calls: Array<[label: string, count: number]> = []
    const debounced = debounce((label: string, count: number) => {
      calls.push([label, count])
    }, 50)

    debounced('first', 1)
    debounced('second', 2)

    expect(calls).toEqual([])
    vi.advanceTimersByTime(49)
    expect(calls).toEqual([])
    vi.advanceTimersByTime(1)
    expect(calls).toEqual([['second', 2]])
  })

  it('can cancel a pending debounced call', () => {
    vi.useFakeTimers()
    const calls: string[] = []
    const debounced = debounce((value: string) => {
      calls.push(value)
    }, 25)

    debounced('skip')
    debounced.cancel()
    vi.advanceTimersByTime(25)

    expect(calls).toEqual([])
  })

  it('redacts likely secrets before writing to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })

    await expect(copyToClipboard('token=sk-test-secret password=secret123')).resolves.toBe(true)
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('[REDACTED]'))
    expect(writeText.mock.calls[0][0]).not.toContain('sk-')
    expect(writeText.mock.calls[0][0]).not.toContain('secret123')
  })
})
