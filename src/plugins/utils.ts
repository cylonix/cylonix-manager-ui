// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { Buffer } from "buffer";

export function hexTo64(s: string): string {
    return Buffer.from(s, 'hex').toString('base64');
}

export function compactList(l?: Array<string>): string | undefined {
    if (!l) {
        return undefined
    }
    if (l.length == 1) {
        return l[0]
    }
    return l.join(',')
}

export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

export function isMacOS(): boolean {
  console.log('Checking if macOS', navigator.userAgent, 'userAgentData', 'userAgentData' in navigator)
  // Try using modern API first
  if ('userAgentData' in navigator) {
    return (navigator as any).userAgentData.platform === 'macOS'
  }
  // Fallback to userAgent string
  return /Mac OS/.test(navigator.userAgent)
}

export function shortUUID(uuid: string | undefined): string | undefined {
  return uuid?.substring(0, 18) + '...'
}

export function parseKeyValueString(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  let currentKey = '';
  let currentValue = '';
  let isInQuotes = false;
  let isParsingKey = true;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (char === '"' && input[i - 1] !== '\\') {
      isInQuotes = !isInQuotes;
      i++;
      continue;
    }

    if (isInQuotes) {
      currentValue += char;
      i++;
      continue;
    }

    if (char === '=' && isParsingKey) {
      isParsingKey = false;
      i++;
      continue;
    }

    if (char === ' ' && !isInQuotes && !isParsingKey) {
      if (currentKey) {
        result[currentKey] = currentValue;
        currentKey = '';
        currentValue = '';
        isParsingKey = true;
      }
      i++;
      continue;
    }

    if (isParsingKey) {
      currentKey += char;
    } else {
      currentValue += char;
    }
    i++;
  }

  // Handle the last key-value pair
  if (currentKey && currentValue) {
    result[currentKey] = currentValue;
  } else if (currentKey) {
    result[currentKey] = '';
  }

  return result;
}

export function parseKVorJSON(s?: string) {
  if (s) {
    try {
      return JSON.parse(s)
    } catch (e) {
      return parseKeyValueString(s)
    }
  }
}
