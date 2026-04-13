// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { describe, it, expect, vi } from 'vitest'

// Mock the API module to avoid pulling in generated client dependencies
vi.mock('@/plugins/api', () => ({
  tryRequest: vi.fn(),
}))

import { buildSortParams } from './useServerTable'

describe('buildSortParams', () => {
  it('returns undefined for empty sort', () => {
    const result = buildSortParams([])
    expect(result.sortBy).toBeUndefined()
    expect(result.sortDesc).toBeUndefined()
  })

  it('decamelizes a single sort key', () => {
    const result = buildSortParams([{ key: 'givenName', order: 'asc' }])
    expect(result.sortBy).toBe('given_name')
    expect(result.sortDesc).toBe('asc')
  })

  it('handles missing order', () => {
    const result = buildSortParams([{ key: 'createdAt' }])
    expect(result.sortBy).toBe('created_at')
    expect(result.sortDesc).toBe('')
  })

  it('concatenates multiple sort fields', () => {
    const result = buildSortParams([
      { key: 'givenName', order: 'asc' },
      { key: 'createdAt', order: 'desc' },
    ])
    expect(result.sortBy).toBe('given_name,created_at')
    expect(result.sortDesc).toBe('asc,desc')
  })
})
