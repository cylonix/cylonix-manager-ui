<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { mdiInformationOutline } from '@mdi/js'
import {
  formatDst,
  parsePolicy,
  selectorKind,
  type NormalizedDst,
  type NormalizedRule,
} from '@/utils/policy'

const props = defineProps<{
  policy?: string | null
  highlightSrc?: string | null
  highlightDst?: string | null
}>()

const emit = defineEmits<{
  (e: 'select', src: string | null, dst: string | null): void
}>()

type CellStatus = 'accept-all' | 'accept-partial' | 'deny' | 'mixed' | 'none'

interface CellRuleRef {
  rule: NormalizedRule
  dst: NormalizedDst
}

interface Cell {
  status: CellStatus
  rules: CellRuleRef[]
  summary: string
}

const parsed = computed(() => parsePolicy(props.policy))

const sortedSources = computed(() => {
  return [...parsed.value.rawSelectors.sources].sort(selectorSort)
})

const sortedDestinations = computed(() => {
  return [...parsed.value.rawSelectors.destinations].sort(selectorSort)
})

function selectorSort(a: string, b: string): number {
  const kindOrder: Record<string, number> = {
    wildcard: 0,
    autogroup: 1,
    group: 2,
    tag: 3,
    user: 4,
    cidr: 5,
    host: 6,
  }
  const ka = kindOrder[selectorKind(a)] ?? 99
  const kb = kindOrder[selectorKind(b)] ?? 99
  if (ka !== kb) return ka - kb
  return a.localeCompare(b)
}

const matrix = computed<Cell[][]>(() => {
  const sources = sortedSources.value
  const destinations = sortedDestinations.value
  const rules = parsed.value.acls

  return sources.map((src) => {
    return destinations.map((dst) => computeCell(src, dst, rules))
  })
})

function computeCell(
  src: string,
  dst: string,
  rules: NormalizedRule[],
): Cell {
  const matches: CellRuleRef[] = []
  rules.forEach((rule) => {
    if (!rule.src.includes(src)) return
    rule.dst.forEach((d) => {
      if (d.selector === dst) matches.push({ rule, dst: d })
    })
  })

  if (!matches.length) {
    return { status: 'none', rules: [], summary: '' }
  }

  const actions = new Set(matches.map((m) => m.rule.action))
  const anyFullAccept = matches.some(
    (m) => m.rule.action === 'accept' && m.dst.blocksAll,
  )
  const onlyDeny = actions.size === 1 && actions.has('deny')
  const mixed = actions.size > 1

  let status: CellStatus
  if (onlyDeny) status = 'deny'
  else if (mixed) status = 'mixed'
  else if (anyFullAccept) status = 'accept-all'
  else status = 'accept-partial'

  const summary = matches
    .slice(0, 3)
    .map((m) => `${m.rule.action === 'accept' ? '✓' : '✗'} ${formatDst(m.dst)}`)
    .join(' · ')

  return { status, rules: matches, summary }
}

const statusColor: Record<CellStatus, string> = {
  'accept-all': '#4caf50',
  'accept-partial': '#ffb300',
  deny: '#f44336',
  mixed: '#9c27b0',
  none: 'transparent',
}

const statusBg: Record<CellStatus, string> = {
  'accept-all': 'rgba(76, 175, 80, 0.18)',
  'accept-partial': 'rgba(255, 179, 0, 0.18)',
  deny: 'rgba(244, 67, 54, 0.18)',
  mixed: 'rgba(156, 39, 176, 0.20)',
  none: 'transparent',
}

const statusLabel: Record<CellStatus, string> = {
  'accept-all': 'Allowed',
  'accept-partial': 'Restricted',
  deny: 'Denied',
  mixed: 'Mixed',
  none: 'No rule',
}

const selected = computed<{
  src: string
  dst: string
  cell: Cell
} | null>(() => {
  const { highlightSrc, highlightDst } = props
  if (!highlightSrc || !highlightDst) return null
  const srcIdx = sortedSources.value.indexOf(highlightSrc)
  const dstIdx = sortedDestinations.value.indexOf(highlightDst)
  if (srcIdx < 0 || dstIdx < 0) return null
  const cell = matrix.value[srcIdx]?.[dstIdx]
  if (!cell || cell.status === 'none') return null
  return { src: highlightSrc, dst: highlightDst, cell }
})

function selectCell(src: string, dst: string, cell: Cell) {
  if (cell.status === 'none') {
    emit('select', null, null)
    return
  }
  const alreadySelected =
    props.highlightSrc === src && props.highlightDst === dst
  emit('select', alreadySelected ? null : src, alreadySelected ? null : dst)
}

function isActive(src: string, dst: string) {
  return props.highlightSrc === src && props.highlightDst === dst
}

function clearSelection() {
  emit('select', null, null)
}

watchEffect(() => {
  // If highlight points to a selector that no longer exists (policy edit),
  // clear it so stale state doesn't linger.
  const { highlightSrc, highlightDst } = props
  if (!highlightSrc && !highlightDst) return
  const haveSrc = !highlightSrc || sortedSources.value.includes(highlightSrc)
  const haveDst =
    !highlightDst || sortedDestinations.value.includes(highlightDst)
  if (!haveSrc || !haveDst) emit('select', null, null)
})
</script>

<template>
  <div>
    <v-alert
      v-if="!parsed.ok"
      type="error"
      variant="tonal"
      class="mb-3"
      density="comfortable"
    >
      Could not parse policy{{ parsed.error ? `: ${parsed.error}` : '' }}.
    </v-alert>

    <v-row dense class="mb-2">
      <v-col cols="auto">
        <v-chip color="primary" variant="tonal" size="small" label>
          {{ sortedSources.length }} source{{ sortedSources.length === 1 ? '' : 's' }}
          × {{ sortedDestinations.length }} destination{{
            sortedDestinations.length === 1 ? '' : 's'
          }}
        </v-chip>
      </v-col>
      <v-col cols="auto">
        <div class="matrix-legend">
          <span class="legend-swatch" :style="{ background: statusBg['accept-all'], borderColor: statusColor['accept-all'] }" />
          Allowed
          <span class="legend-swatch ml-3" :style="{ background: statusBg['accept-partial'], borderColor: statusColor['accept-partial'] }" />
          Restricted
          <span class="legend-swatch ml-3" :style="{ background: statusBg.deny, borderColor: statusColor.deny }" />
          Denied
          <span class="legend-swatch ml-3" :style="{ background: statusBg.mixed, borderColor: statusColor.mixed }" />
          Mixed
        </div>
      </v-col>
    </v-row>

    <div
      v-if="!sortedSources.length || !sortedDestinations.length"
      class="empty-state"
    >
      No ACL rules to visualize. Add rules in the Editor tab.
    </div>

    <v-card v-else variant="outlined" class="matrix-card">
      <div class="matrix-scroll">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="matrix-corner">
                <span class="text-caption text-medium-emphasis">src \ dst</span>
              </th>
              <th
                v-for="dst in sortedDestinations"
                :key="dst"
                class="matrix-col-header"
              >
                <div class="matrix-col-label">{{ dst }}</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(src, rowIdx) in sortedSources" :key="src">
              <th class="matrix-row-header">
                {{ src }}
              </th>
              <td
                v-for="(dst, colIdx) in sortedDestinations"
                :key="dst"
                class="matrix-cell"
                :class="{
                  'matrix-cell--active': isActive(src, dst),
                  'matrix-cell--empty': matrix[rowIdx]![colIdx]!.status === 'none',
                }"
                :style="{
                  background: statusBg[matrix[rowIdx]![colIdx]!.status],
                  borderColor:
                    matrix[rowIdx]![colIdx]!.status === 'none'
                      ? 'transparent'
                      : statusColor[matrix[rowIdx]![colIdx]!.status],
                }"
                @click="selectCell(src, dst, matrix[rowIdx]![colIdx]!)"
              >
                <v-tooltip
                  v-if="matrix[rowIdx]![colIdx]!.status !== 'none'"
                  location="top"
                  :text="matrix[rowIdx]![colIdx]!.summary || statusLabel[matrix[rowIdx]![colIdx]!.status]"
                >
                  <template v-slot:activator="{ props: tipProps }">
                    <div v-bind="tipProps" class="cell-inner">
                      <span class="cell-count">
                        {{ matrix[rowIdx]![colIdx]!.rules.length }}
                      </span>
                    </div>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </v-card>

    <v-expand-transition>
      <v-card
        v-if="selected"
        variant="outlined"
        class="mt-3 details-card"
      >
        <v-card-title class="text-subtitle-1 d-flex align-center">
          <v-icon :icon="mdiInformationOutline" class="mr-2" />
          <span>
            {{ selected.src }} → {{ selected.dst }}
          </span>
          <v-spacer />
          <v-chip
            :color="
              selected.cell.status === 'accept-all'
                ? 'success'
                : selected.cell.status === 'deny'
                ? 'error'
                : selected.cell.status === 'mixed'
                ? 'purple'
                : 'warning'
            "
            size="small"
            variant="tonal"
            label
          >
            {{ statusLabel[selected.cell.status] }}
          </v-chip>
          <v-btn
            icon="mdi-close"
            size="x-small"
            variant="text"
            class="ml-2"
            @click="clearSelection"
          />
        </v-card-title>
        <v-divider />
        <v-list density="compact">
          <v-list-item
            v-for="(m, i) in selected.cell.rules"
            :key="`${m.rule.index}-${i}`"
          >
            <template v-slot:prepend>
              <v-chip
                :color="m.rule.action === 'accept' ? 'success' : 'error'"
                size="x-small"
                variant="tonal"
                label
              >
                {{ m.rule.action }}
              </v-chip>
            </template>
            <v-list-item-title>
              Rule #{{ m.rule.index + 1 }} — {{ formatDst(m.dst) }}
            </v-list-item-title>
            <v-list-item-subtitle>
              from {{ m.rule.src.join(', ') }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<style scoped>
.matrix-card {
  overflow: hidden;
}

.matrix-scroll {
  overflow: auto;
  max-height: 65vh;
}

.matrix-table {
  border-collapse: separate;
  border-spacing: 4px;
  padding: 8px;
  min-width: 100%;
}

.matrix-corner {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 3;
  background: rgb(var(--v-theme-surface));
  padding: 8px 12px;
  min-width: 160px;
  text-align: left;
  font-weight: 500;
}

.matrix-col-header {
  position: sticky;
  top: 0;
  z-index: 2;
  background: rgb(var(--v-theme-surface));
  padding: 6px 10px;
  min-width: 100px;
  max-width: 160px;
  font-weight: 500;
  font-size: 12px;
  text-align: left;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.matrix-col-label {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-row-header {
  position: sticky;
  left: 0;
  z-index: 1;
  background: rgb(var(--v-theme-surface));
  padding: 8px 12px;
  font-weight: 500;
  font-size: 13px;
  text-align: left;
  white-space: nowrap;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  min-width: 160px;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matrix-cell {
  min-width: 60px;
  height: 44px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.matrix-cell--empty {
  cursor: default;
}

.matrix-cell:hover:not(.matrix-cell--empty) {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.matrix-cell--active {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

.cell-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.9;
}

.cell-count {
  font-variant-numeric: tabular-nums;
}

.matrix-legend {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.8;
}

.legend-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid;
  border-radius: 4px;
  margin-right: 4px;
  vertical-align: middle;
}

.empty-state {
  padding: 48px 16px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.6;
  font-size: 14px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 8px;
}

.details-card {
  max-height: 300px;
  overflow-y: auto;
}
</style>
