// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { onBeforeUnmount, onMounted } from 'vue'

export interface HotkeyBinding {
  keys: string
  description?: string
  handler: (e: KeyboardEvent) => void
  allowInInputs?: boolean
}

const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

export const modKey = IS_MAC ? '⌘' : 'Ctrl'

// Registry so a help dialog can enumerate everything.
const registry = new Set<HotkeyBinding>()

export function listHotkeys(): HotkeyBinding[] {
  return Array.from(registry)
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  // Monaco uses a textarea inside .monaco-editor; the check above catches it.
  return false
}

function parseCombo(combo: string): {
  mod: boolean
  shift: boolean
  alt: boolean
  key: string
} {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim())
  const key = parts.pop() ?? ''
  return {
    mod: parts.includes('mod') || parts.includes('cmd') || parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt') || parts.includes('option'),
    key,
  }
}

function matches(e: KeyboardEvent, combo: string): boolean {
  const { mod, shift, alt, key } = parseCombo(combo)
  const modPressed = IS_MAC ? e.metaKey : e.ctrlKey
  if (mod !== modPressed) return false
  if (shift !== e.shiftKey) return false
  if (alt !== e.altKey) return false
  // For non-mod single-key bindings we don't want random ctrl/meta to match.
  if (!mod && (e.ctrlKey || e.metaKey)) return false
  return e.key.toLowerCase() === key
}

export function useHotkeys(bindings: HotkeyBinding[]) {
  function onKeydown(e: KeyboardEvent) {
    for (const b of bindings) {
      if (!b.allowInInputs && isEditableTarget(e.target)) continue
      if (matches(e, b.keys)) {
        e.preventDefault()
        b.handler(e)
        return
      }
    }
  }

  onMounted(() => {
    bindings.forEach((b) => registry.add(b))
    window.addEventListener('keydown', onKeydown)
  })

  onBeforeUnmount(() => {
    bindings.forEach((b) => registry.delete(b))
    window.removeEventListener('keydown', onKeydown)
  })
}
