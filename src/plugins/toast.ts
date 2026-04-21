// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

/**
 *
 * @export
 * @interface Toast
 */
export interface Toast {
  text?: string
  color?: string
  timeout?: number
  on: boolean
  type?: ToastType
}

const typeColors: Record<ToastType, string> = {
  success: 'green',
  info: 'blue',
  warning: 'orange',
  error: 'red',
}

const defaultTimeouts: Record<ToastType, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000,
}

export function newToast(t: Toast) {
  const { toast } = storeToRefs(useToastStore())
  if (t.type && !t.color) t.color = typeColors[t.type]
  if (t.type && t.timeout === undefined) t.timeout = defaultTimeouts[t.type]
  toast.value = t
}

export function pushSuccess(text: string, opts?: Partial<Toast>) {
  newToast({ on: true, type: 'success', text, ...opts })
}

export function pushError(text: string, opts?: Partial<Toast>) {
  newToast({ on: true, type: 'error', text, ...opts })
}

export function pushInfo(text: string, opts?: Partial<Toast>) {
  newToast({ on: true, type: 'info', text, ...opts })
}

export function pushWarning(text: string, opts?: Partial<Toast>) {
  newToast({ on: true, type: 'warning', text, ...opts })
}
