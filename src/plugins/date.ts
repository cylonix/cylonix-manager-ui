// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

const shortFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'short',
  timeStyle: 'short',
  hourCycle: "h24",
})

const shortTimeFmt = new Intl.DateTimeFormat(undefined, {
  timeStyle: 'short',
  hourCycle: "h24",
})

export function toShortFmt(d: Date): string {
  return shortFmt.format(d)
}

export function shortTs(timestamp?: string|number): string | undefined {
  if (timestamp) {
    const d = new Date(timestamp)
    const now = new Date()
    if (d.toDateString() == now.toDateString()) {
      return `today ${shortTimeFmt.format(d)}`
    }
    return toShortFmt(d)
  }
}
export function shortTsUnix(t?: number): string | undefined {
  if (t) {
    const d = new Date(t)
    return toShortFmt(d)
  }
}

export function toHhMmString(d: Date): string {
  const hh = ("00" + d.getHours()).slice(-2)
  const mm = ("00" + d.getMinutes()).slice(-2)
  return hh + ":" + mm
}

export function isZeroTimestamp(timestamp: string): boolean {
  return timestamp === '0001-01-01T00:00:00Z'
}

export const formatExpiry = (expiry?: string) => {
  if (!expiry || isZeroTimestamp(expiry)) {
    return 'never'
  }
  const expiryDate = new Date(expiry)
  const now = new Date()
  const diffTime = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))

  if (diffTime < 0) {
    return undefined
  }

  if (diffDays > 30) {
    const months = Math.floor(diffDays / 30)
    return `in ${months} month${months > 1 ? 's' : ''}`
  }
  if (diffDays > 1) {
    return `in ${diffDays} day${diffDays > 1 ? 's' : ''}`
  }
  if (diffHours > 1) {
    return `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`
  }
  return shortTs(expiry)
}
