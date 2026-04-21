<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { mdiMagnify, mdiKeyboardReturn, mdiArrowUpDown } from '@mdi/js'
import { useNavItems, type NavItem } from '@/composables/useNavItems'
import { useHotkeys, modKey } from '@/composables/useHotkeys'

const open = ref(false)
const query = ref('')
const selected = ref(0)
const inputRef = ref<any>()
const listRef = ref<HTMLElement>()

const router = useRouter()
const { visibleItems } = useNavItems()

// Simple scoring: prefer prefix/word-boundary hits in title, then keywords, then substring.
function score(item: NavItem, q: string): number {
  if (!q) return 1
  const needle = q.toLowerCase()
  const title = item.title.toLowerCase()
  const keywords = (item.keywords ?? []).map((k) => k.toLowerCase())

  if (title === needle) return 100
  if (title.startsWith(needle)) return 80
  if (title.split(/\s+/).some((w) => w.startsWith(needle))) return 60
  if (keywords.some((k) => k === needle)) return 55
  if (keywords.some((k) => k.startsWith(needle))) return 45
  if (title.includes(needle)) return 30
  if (keywords.some((k) => k.includes(needle))) return 20
  if (item.path.toLowerCase().includes(needle)) return 10
  if (item.group?.toLowerCase().includes(needle)) return 10
  return 0
}

const results = computed<NavItem[]>(() => {
  const q = query.value.trim()
  const scored = visibleItems.value
    .map((item) => ({ item, s: score(item, q) }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .map(({ item }) => item)

  // De-dupe by path+title combo.
  const seen = new Set<string>()
  return scored.filter((item) => {
    const k = `${item.path}::${item.title}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  }).slice(0, 40)
})

function openPalette() {
  open.value = true
  query.value = ''
  selected.value = 0
  nextTick(() => {
    inputRef.value?.focus?.()
  })
}

function closePalette() {
  open.value = false
}

function go(item: NavItem | undefined) {
  if (!item) return
  // Push before closing; closing clears `query` which recomputes `results` and can race the push.
  if (router.currentRoute.value.path !== item.path) {
    router.push(item.path)
  }
  closePalette()
}

function moveSelection(delta: number) {
  if (!results.value.length) return
  const len = results.value.length
  selected.value = (selected.value + delta + len) % len
  // Scroll into view.
  nextTick(() => {
    const el = listRef.value?.querySelector<HTMLElement>(
      `[data-index="${selected.value}"]`,
    )
    el?.scrollIntoView({ block: 'nearest' })
  })
}

watch(query, () => {
  selected.value = 0
})

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    moveSelection(1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    moveSelection(-1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    go(results.value[selected.value])
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closePalette()
  }
}

useHotkeys([
  {
    keys: 'mod+k',
    description: 'Open command palette',
    handler: () => (open.value ? closePalette() : openPalette()),
    allowInInputs: true,
  },
])
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="620"
    scrollable
    transition="fade-transition"
    @update:model-value="(v) => !v && (query = '')"
  >
    <v-card class="cmdk-card" rounded="lg">
      <div class="cmdk-input-row">
        <v-icon :icon="mdiMagnify" class="mr-2" />
        <input
          ref="inputRef"
          v-model="query"
          class="cmdk-input"
          type="text"
          placeholder="Jump to page, search…"
          autocomplete="off"
          spellcheck="false"
          @keydown="onKeydown"
        />
        <v-chip
          size="x-small"
          variant="tonal"
          class="ml-2 text-uppercase"
          label
        >
          Esc
        </v-chip>
      </div>
      <v-divider />
      <div ref="listRef" class="cmdk-list">
        <template v-if="results.length">
          <div
            v-for="(item, i) in results"
            :key="`${item.path}-${item.title}-${i}`"
            :data-index="i"
            class="cmdk-item"
            :class="{ 'cmdk-item--selected': i === selected }"
            @mouseenter="selected = i"
            @click="go(item)"
          >
            <v-icon v-if="item.icon" :icon="item.icon" size="20" class="mr-3" />
            <div class="cmdk-item-main">
              <div class="cmdk-item-title">{{ item.title }}</div>
              <div v-if="item.group" class="cmdk-item-sub">
                {{ item.group }} · {{ item.path }}
              </div>
              <div v-else class="cmdk-item-sub">{{ item.path }}</div>
            </div>
            <v-icon
              v-if="i === selected"
              :icon="mdiKeyboardReturn"
              size="16"
              class="cmdk-item-enter"
            />
          </div>
        </template>
        <div v-else class="cmdk-empty">No matches for “{{ query }}”.</div>
      </div>
      <v-divider />
      <div class="cmdk-footer">
        <span>
          <v-icon :icon="mdiArrowUpDown" size="14" /> navigate
        </span>
        <span>
          <v-icon :icon="mdiKeyboardReturn" size="14" /> open
        </span>
        <span class="ml-auto">{{ modKey }}+K</span>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.cmdk-card {
  overflow: hidden;
}

.cmdk-input-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.cmdk-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: inherit;
  font-size: 16px;
  line-height: 24px;
}

.cmdk-list {
  max-height: 420px;
  overflow-y: auto;
  padding: 4px 0;
}

.cmdk-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.cmdk-item--selected {
  background: rgba(var(--v-theme-primary), 0.12);
}

.cmdk-item-main {
  flex: 1;
  min-width: 0;
}

.cmdk-item-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 18px;
}

.cmdk-item-sub {
  font-size: 12px;
  opacity: 0.65;
  line-height: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cmdk-item-enter {
  opacity: 0.6;
}

.cmdk-empty {
  padding: 32px 16px;
  text-align: center;
  opacity: 0.6;
  font-size: 14px;
}

.cmdk-footer {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px 16px;
  font-size: 12px;
  opacity: 0.7;
}
</style>
