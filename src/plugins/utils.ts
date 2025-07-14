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
