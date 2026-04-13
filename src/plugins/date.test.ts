// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { describe, it, expect } from 'vitest'
import { toShortFmt, shortTs, isZeroTimestamp, formatExpiry } from './date'

describe('isZeroTimestamp', () => {
  it('returns true for zero timestamp', () => {
    expect(isZeroTimestamp('0001-01-01T00:00:00Z')).toBe(true)
  })

  it('returns false for non-zero timestamp', () => {
    expect(isZeroTimestamp('2024-01-01T00:00:00Z')).toBe(false)
  })
})

describe('toShortFmt', () => {
  it('formats a date', () => {
    const d = new Date('2024-06-15T14:30:00Z')
    const result = toShortFmt(d)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})

describe('shortTs', () => {
  it('returns undefined for undefined input', () => {
    expect(shortTs(undefined)).toBeUndefined()
  })

  it('formats a string timestamp', () => {
    const result = shortTs('2024-01-15T10:30:00Z')
    expect(result).toBeTruthy()
  })

  it('formats a numeric timestamp (seconds)', () => {
    const result = shortTs(1705312200) // Jan 15, 2024
    expect(result).toBeTruthy()
  })
})

describe('formatExpiry', () => {
  it('returns "never" for undefined', () => {
    expect(formatExpiry(undefined)).toBe('never')
  })

  it('returns "never" for zero timestamp', () => {
    expect(formatExpiry('0001-01-01T00:00:00Z')).toBe('never')
  })

  it('returns undefined for past dates', () => {
    expect(formatExpiry('2020-01-01T00:00:00Z')).toBeUndefined()
  })

  it('returns relative time for future dates', () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)
    const result = formatExpiry(future.toISOString())
    expect(result).toContain('in')
    expect(result).toContain('day')
  })

  it('returns months for dates far in the future', () => {
    const future = new Date()
    future.setMonth(future.getMonth() + 3)
    const result = formatExpiry(future.toISOString())
    expect(result).toContain('month')
  })
})
