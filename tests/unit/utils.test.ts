import { afterEach, describe, expect, it, vi } from 'vitest'
import { classNames, debounce } from '../../src/renderer/lib/utils'

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
})
