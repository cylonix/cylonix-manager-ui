// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { describe, it, expect } from 'vitest'
import {
  hexTo64,
  compactList,
  shortUUID,
  shortString,
  parseKeyValueString,
  hexToBase64,
  base64ToHex,
  parseKVorJSON,
} from './utils'

describe('hexTo64', () => {
  it('converts hex string to base64', () => {
    expect(hexTo64('48656c6c6f')).toBe('SGVsbG8=')
  })
})

describe('compactList', () => {
  it('returns undefined for undefined input', () => {
    expect(compactList(undefined)).toBeUndefined()
  })

  it('returns single element for single-element array', () => {
    expect(compactList(['hello'])).toBe('hello')
  })

  it('joins multiple elements with comma', () => {
    expect(compactList(['a', 'b', 'c'])).toBe('a,b,c')
  })
})

describe('shortUUID', () => {
  it('truncates UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000'
    expect(shortUUID(uuid)).toBe('550e8400-e29b-41d4...')
  })

  it('handles undefined', () => {
    expect(shortUUID(undefined)).toBe('undefined...')
  })
})

describe('shortString', () => {
  it('returns short strings unchanged', () => {
    expect(shortString('hello')).toBe('hello')
  })

  it('truncates long strings at default length', () => {
    expect(shortString('a very long string here')).toBe('a very long ...')
  })

  it('truncates at custom length', () => {
    expect(shortString('hello world', 5)).toBe('hello...')
  })

  it('handles undefined', () => {
    expect(shortString(undefined)).toBeUndefined()
  })
})

describe('parseKeyValueString', () => {
  it('parses simple key=value pairs', () => {
    expect(parseKeyValueString('key1=value1 key2=value2')).toEqual({
      key1: 'value1',
      key2: 'value2',
    })
  })

  it('parses quoted values', () => {
    expect(parseKeyValueString('name="John Doe" age=30')).toEqual({
      name: 'John Doe',
      age: '30',
    })
  })

  it('handles empty string', () => {
    expect(parseKeyValueString('')).toEqual({})
  })

  it('handles key without value', () => {
    expect(parseKeyValueString('flag')).toEqual({ flag: '' })
  })
})

describe('hexToBase64', () => {
  it('converts first 4 bytes by default', () => {
    const result = hexToBase64('48656c6c6f')
    // Should only use first 8 hex chars (4 bytes): 48656c6c
    expect(result).toBe('SGVsbA==')
  })

  it('converts full string when fullString is true', () => {
    const result = hexToBase64('48656c6c6f', true)
    expect(result).toBe('SGVsbG8=')
  })
})

describe('base64ToHex', () => {
  it('converts base64 to hex', () => {
    expect(base64ToHex('SGVsbG8=')).toBe('48656c6c6f')
  })
})

describe('parseKVorJSON', () => {
  it('parses JSON strings', () => {
    expect(parseKVorJSON('{"key":"value"}')).toEqual({ key: 'value' })
  })

  it('falls back to key-value parsing for non-JSON', () => {
    expect(parseKVorJSON('key=value')).toEqual({ key: 'value' })
  })

  it('returns undefined for undefined input', () => {
    expect(parseKVorJSON(undefined)).toBeUndefined()
  })
})
