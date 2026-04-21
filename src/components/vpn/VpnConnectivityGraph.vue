<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  Handle,
  MarkerType,
  Panel,
  Position,
  VueFlow,
  type Edge as FlowEdge,
  type Node as FlowNode,
  useVueFlow,
} from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import type { V1Node } from '@/clients/headscale/api'
import {
  formatDst,
  parsePolicy,
  selectorKind,
  type NormalizedDst,
  type NormalizedRule,
  type ParsedPolicy,
} from '@/utils/policy'
import { useTheme } from 'vuetify'

type EdgeStatus = 'accept-all' | 'accept-partial' | 'deny'
type DiffKind = 'unchanged' | 'added' | 'removed'

interface RuleEdge {
  ruleIndex: number
  action: 'accept' | 'deny'
  src: string
  dst: string
  dstEntry: NormalizedDst
  isDefaultAll: boolean
  key: string
}

interface DisplayEdge {
  id: string
  src: string
  dst: string
  status: EdgeStatus
  diff: DiffKind
  refs: RuleEdge[]
  label: string
}

const props = defineProps<{
  nodes: V1Node[]
  policy?: string | null
  savedPolicy?: string | null
  loading?: boolean
  highlightRuleIndex?: number | null
  highlightSrc?: string | null
  highlightDst?: string | null
}>()

const emit = defineEmits<{
  (e: 'navigateToRule', ruleIndex: number): void
  (e: 'selectCell', src: string | null, dst: string | null): void
}>()

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const parsedCurrent = computed(() => parsePolicy(props.policy))
const parsedSaved = computed(() => parsePolicy(props.savedPolicy))
const hasDraftDiff = computed(
  () =>
    !!props.savedPolicy &&
    props.savedPolicy.trim().length > 0 &&
    (props.policy ?? '') !== (props.savedPolicy ?? ''),
)

const search = ref('')
const hideDefaultAccept = ref(false)
const statusFilter = ref<'all' | 'restricted' | 'denied'>('all')
const diffOnly = ref(false)

const selectedEdgeId = ref<string>()
const selectedNodeId = ref<string>()
const paneReady = ref(false)

const { fitView, onPaneReady, onEdgeClick, onPaneClick, onNodeClick } =
  useVueFlow()

onPaneReady(async () => {
  paneReady.value = true
  await nextTick()
  if (flowNodes.value.length) fitView({ padding: 0.2, duration: 200 })
})

onEdgeClick(({ edge }) => {
  selectedEdgeId.value = edge?.id
  selectedNodeId.value = undefined
})

onNodeClick(({ node }) => {
  selectedNodeId.value = node.id
  selectedEdgeId.value = undefined
  const raw = node.data?.selector as string | undefined
  const side = node.data?.side as 'src' | 'dst' | undefined
  if (raw && side) {
    emit('selectCell', side === 'src' ? raw : null, side === 'dst' ? raw : null)
  }
})

onPaneClick(() => {
  selectedEdgeId.value = undefined
  selectedNodeId.value = undefined
})

function ruleEdgesFor(parsed: ParsedPolicy): RuleEdge[] {
  const out: RuleEdge[] = []
  parsed.acls.forEach((rule: NormalizedRule) => {
    rule.src.forEach((src) => {
      rule.dst.forEach((dst) => {
        const isDefaultAll =
          rule.action === 'accept' &&
          (src === '*' || src === 'autogroup:members') &&
          dst.blocksAll &&
          (dst.selector === '*' || dst.selector === 'autogroup:members')
        out.push({
          ruleIndex: rule.index,
          action: rule.action,
          src,
          dst: dst.selector,
          dstEntry: dst,
          isDefaultAll,
          key: `${rule.action}|${src}|${dst.raw}`,
        })
      })
    })
  })
  return out
}

const currentRuleEdges = computed(() => ruleEdgesFor(parsedCurrent.value))
const savedRuleEdges = computed(() => ruleEdgesFor(parsedSaved.value))

// Merge current + removed-from-saved, tagging each with diff.
const allRuleEdges = computed<RuleEdge[]>(() => {
  if (!hasDraftDiff.value) {
    return currentRuleEdges.value
  }
  const savedKeys = new Set(savedRuleEdges.value.map((e) => e.key))
  const currentKeys = new Set(currentRuleEdges.value.map((e) => e.key))
  const combined = [...currentRuleEdges.value]
  savedRuleEdges.value.forEach((e) => {
    if (!currentKeys.has(e.key)) combined.push(e)
  })
  return combined.map((e) => {
    const inCurrent = currentKeys.has(e.key)
    const inSaved = savedKeys.has(e.key)
    const diff: DiffKind = inCurrent && inSaved
      ? 'unchanged'
      : inCurrent
        ? 'added'
        : 'removed'
    return { ...e, _diff: diff } as RuleEdge & { _diff: DiffKind }
  })
})

function edgeStatus(refs: RuleEdge[]): EdgeStatus {
  const anyDeny = refs.some((r) => r.action === 'deny')
  const anyFullAccept = refs.some(
    (r) => r.action === 'accept' && r.dstEntry.blocksAll,
  )
  if (anyDeny && !anyFullAccept) return 'deny'
  if (anyFullAccept) return 'accept-all'
  return 'accept-partial'
}

function matchesSearch(edge: RuleEdge, q: string): boolean {
  if (!q) return true
  const n = q.toLowerCase()
  return (
    edge.src.toLowerCase().includes(n) ||
    edge.dst.toLowerCase().includes(n) ||
    edge.dstEntry.raw.toLowerCase().includes(n)
  )
}

function passesFilter(edge: RuleEdge & { _diff?: DiffKind }): boolean {
  if (hideDefaultAccept.value && edge.isDefaultAll) return false
  if (statusFilter.value === 'denied' && edge.action !== 'deny') return false
  if (statusFilter.value === 'restricted') {
    if (edge.action !== 'accept') return false
    if (edge.dstEntry.blocksAll) return false
  }
  if (diffOnly.value && hasDraftDiff.value && edge._diff === 'unchanged') {
    return false
  }
  return matchesSearch(edge, search.value.trim())
}

const filteredRuleEdges = computed(() =>
  allRuleEdges.value.filter(passesFilter),
)

// Group into display edges by (src, dst, status, diff).
const displayEdges = computed<DisplayEdge[]>(() => {
  const groups = new Map<string, DisplayEdge>()
  filteredRuleEdges.value.forEach((re) => {
    const diff = (re as RuleEdge & { _diff?: DiffKind })._diff ?? 'unchanged'
    const status = edgeStatus([re])
    const groupKey = `${re.src}||${re.dst}||${status}||${diff}`
    const existing = groups.get(groupKey)
    if (existing) {
      existing.refs.push(re)
    } else {
      groups.set(groupKey, {
        id: groupKey,
        src: re.src,
        dst: re.dst,
        status,
        diff,
        refs: [re],
        label: '',
      })
    }
  })
  groups.forEach((e) => {
    if (e.refs.length === 1) {
      e.label = formatDst(e.refs[0]!.dstEntry)
    } else {
      e.label = `${e.refs.length} rules`
    }
  })
  return [...groups.values()]
})

const sortedSources = computed(() => {
  const set = new Set<string>()
  displayEdges.value.forEach((e) => set.add(e.src))
  return [...set].sort(sortSelectors)
})

const sortedDestinations = computed(() => {
  const set = new Set<string>()
  displayEdges.value.forEach((e) => set.add(e.dst))
  return [...set].sort(sortSelectors)
})

const kindOrder: Record<string, number> = {
  wildcard: 0,
  autogroup: 1,
  group: 2,
  tag: 3,
  user: 4,
  cidr: 5,
  host: 6,
}

function sortSelectors(a: string, b: string): number {
  const ka = kindOrder[selectorKind(a)] ?? 99
  const kb = kindOrder[selectorKind(b)] ?? 99
  if (ka !== kb) return ka - kb
  return a.localeCompare(b)
}

// Member counts: how many live V1Nodes does this selector cover?
function memberCount(selector: string): number | undefined {
  if (!props.nodes?.length) return undefined
  const s = selector.trim()
  if (!s || s === '*' || s === 'autogroup:members') return props.nodes.length
  if (s.startsWith('tag:')) {
    const wanted = s.slice(4)
    return props.nodes.filter((n: V1Node) => {
      const tags = extractArray(n, [
        'tags',
        'validTags',
        'forcedTags',
        'advertisedTags',
      ])
      return tags.some((t) => t === wanted || t === `tag:${wanted}`)
    }).length
  }
  if (s.startsWith('user:') || s.includes('@')) {
    const wanted = s.startsWith('user:') ? s.slice(5) : s
    return props.nodes.filter((n: V1Node) => {
      const name = String((n as any).user?.loginName ?? (n as any).user?.name ?? '')
      return name === wanted || name.endsWith(wanted)
    }).length
  }
  if (s.startsWith('group:') || s.startsWith('autogroup:')) {
    return undefined
  }
  if (/^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(s)) {
    const [prefix] = s.split('/')
    return props.nodes.filter((n: V1Node) => {
      const ips = extractArray(n, ['ipAddresses', 'addresses'])
      return ips.some((ip) => ip === s || ip === prefix)
    }).length
  }
  return undefined
}

function extractArray(n: V1Node, keys: string[]): string[] {
  const out: string[] = []
  keys.forEach((k) => {
    const v = (n as Record<string, unknown>)[k]
    if (Array.isArray(v)) v.forEach((x) => typeof x === 'string' && out.push(x))
  })
  return out
}

const flowNodes = computed<FlowNode[]>(() => {
  const rowHeight = 56
  const leftX = 40
  const rightX = 680
  const nodes: FlowNode[] = []

  const pushNode = (selector: string, side: 'src' | 'dst', index: number) => {
    const id = `${side}:${selector}`
    const kind = selectorKind(selector)
    const members = memberCount(selector)
    const meta = metaLabel(kind, members)
    const unused = members === 0
    const highlighted =
      (side === 'src' && props.highlightSrc === selector) ||
      (side === 'dst' && props.highlightDst === selector)
    nodes.push({
      id,
      position: {
        x: side === 'src' ? leftX : rightX,
        y: 40 + index * rowHeight,
      },
      data: {
        selector,
        side,
        kind,
        members,
        meta,
        unused,
        highlighted,
      },
      type: 'entity',
      sourcePosition: side === 'src' ? Position.Right : Position.Left,
      targetPosition: side === 'src' ? Position.Right : Position.Left,
      style: nodeStyle(kind, highlighted, unused),
    })
  }

  sortedSources.value.forEach((s, i) => pushNode(s, 'src', i))
  sortedDestinations.value.forEach((d, i) => pushNode(d, 'dst', i))
  return nodes
})

function metaLabel(kind: string, members: number | undefined): string {
  const kindWord: Record<string, string> = {
    wildcard: 'any node',
    autogroup: 'autogroup',
    group: 'group',
    tag: 'tag',
    user: 'user',
    cidr: 'subnet',
    host: 'host',
  }
  const word = kindWord[kind] ?? 'selector'
  if (members === undefined) {
    return `${word} · members not resolved`
  }
  const noun = members === 1 ? 'node' : 'nodes'
  const suffix = members === 0 ? ' · no matches' : ''
  return `${word} · ${members} ${noun}${suffix}`
}

function nodeStyle(
  kind: string,
  highlighted: boolean,
  unused: boolean,
): Record<string, string> {
  const borderByKind: Record<string, string> = {
    wildcard: '#607d8b',
    autogroup: '#3949ab',
    group: '#7b1fa2',
    tag: '#00897b',
    user: '#1e88e5',
    cidr: '#ef6c00',
    host: '#455a64',
  }
  const border = borderByKind[kind] ?? '#546e7a'
  const borderStyle = unused ? 'dashed' : 'solid'
  return {
    width: '220px',
    minHeight: '52px',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'left',
    background: isDark.value
      ? 'rgba(255,255,255,0.04)'
      : 'rgba(255,255,255,0.9)',
    color: isDark.value ? '#e3e3e3' : '#1a1a1a',
    border: `${highlighted ? '2px' : '1px'} ${borderStyle} ${border}`,
    opacity: unused && !highlighted ? '0.75' : '1',
    boxShadow: highlighted
      ? `0 0 0 2px ${border}55, 0 4px 12px rgba(0,0,0,0.25)`
      : '0 1px 3px rgba(0,0,0,0.15)',
  }
}

interface EdgeStyleObj {
  stroke: string
  strokeWidth: number
  opacity: number
  strokeDasharray?: string
}

const flowEdgesList = computed<FlowEdge[]>(() => {
  return displayEdges.value.map((e) => {
    const base = edgeStyle(e)
    const ruleHit =
      props.highlightRuleIndex != null &&
      e.refs.some((r) => r.ruleIndex === props.highlightRuleIndex)
    const selected = selectedEdgeId.value === e.id
    const style: EdgeStyleObj = {
      ...base,
      strokeWidth: selected || ruleHit ? 3 : base.strokeWidth,
      opacity: selected || ruleHit ? 1 : base.opacity,
    }
    return {
      id: e.id,
      source: `src:${e.src}`,
      target: `dst:${e.dst}`,
      type: 'default',
      markerEnd: MarkerType.ArrowClosed,
      animated: e.diff !== 'unchanged' || e.status === 'accept-partial',
      label: e.label,
      labelStyle: {
        fill: isDark.value ? '#ddd' : '#222',
        fontSize: '11px',
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: isDark.value ? 'rgba(24,28,34,0.9)' : 'rgba(255,255,255,0.92)',
      },
      labelBgPadding: [4, 4],
      labelBgBorderRadius: 4,
      style,
      data: e,
    } as FlowEdge
  })
})

function edgeStyle(e: DisplayEdge): EdgeStyleObj {
  const palette: Record<EdgeStatus, string> = {
    'accept-all': '#4caf50',
    'accept-partial': '#ffb300',
    deny: '#f44336',
  }
  let stroke = palette[e.status]
  let dash: string | undefined
  let opacity = 0.85
  if (e.diff === 'added') {
    stroke = '#4caf50'
    dash = '8 4'
    opacity = 1
  } else if (e.diff === 'removed') {
    stroke = '#f44336'
    dash = '2 6'
    opacity = 0.9
  } else if (e.status === 'accept-partial') {
    dash = '6 4'
  }
  return { stroke, strokeWidth: 1.5, opacity, strokeDasharray: dash }
}

const selectedDisplayEdge = computed<DisplayEdge | undefined>(() =>
  displayEdges.value.find((e) => e.id === selectedEdgeId.value),
)

const summary = computed(() => {
  const total = allRuleEdges.value.length
  const visible = filteredRuleEdges.value.length
  const byStatus = { 'accept-all': 0, 'accept-partial': 0, deny: 0 } as Record<
    EdgeStatus,
    number
  >
  filteredRuleEdges.value.forEach((e) => {
    byStatus[edgeStatus([e])]++
  })
  let added = 0,
    removed = 0
  if (hasDraftDiff.value) {
    allRuleEdges.value.forEach((e) => {
      const d = (e as RuleEdge & { _diff?: DiffKind })._diff
      if (d === 'added') added++
      else if (d === 'removed') removed++
    })
  }
  return { total, visible, ...byStatus, added, removed }
})

watch(
  [
    () => props.policy,
    () => props.savedPolicy,
    search,
    hideDefaultAccept,
    statusFilter,
    diffOnly,
  ],
  async () => {
    await nextTick()
    if (paneReady.value) fitView({ padding: 0.2, duration: 200 })
  },
)

function goToRule(ruleIndex: number) {
  emit('navigateToRule', ruleIndex)
}

function clearHighlight() {
  emit('selectCell', null, null)
}
</script>

<template>
  <div class="connectivity-graph">
    <div v-if="loading" class="graph-loader">
      <v-skeleton-loader type="image" />
    </div>

    <div v-else-if="!parsedCurrent.ok" class="graph-empty">
      Policy is not parseable. Fix it in the Editor tab.
    </div>

    <div
      v-else-if="!parsedCurrent.acls.length"
      class="graph-empty"
    >
      No ACL rules to visualize. Add rules in the Editor tab.
    </div>

    <template v-else>
      <div class="graph-toolbar">
        <v-text-field
          v-model="search"
          label="Search selector"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          class="toolbar-search"
        />
        <v-btn-toggle
          v-model="statusFilter"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
        >
          <v-btn value="all" size="small">All</v-btn>
          <v-btn value="restricted" size="small">Restricted</v-btn>
          <v-btn value="denied" size="small">Denied</v-btn>
        </v-btn-toggle>
        <v-switch
          v-model="hideDefaultAccept"
          label="Hide default-accept"
          density="compact"
          color="primary"
          hide-details
          class="toolbar-switch"
        />
        <v-switch
          v-if="hasDraftDiff"
          v-model="diffOnly"
          label="Only changed"
          density="compact"
          color="warning"
          hide-details
          class="toolbar-switch"
        />
        <v-chip
          v-if="props.highlightSrc || props.highlightDst"
          size="small"
          color="primary"
          closable
          @click:close="clearHighlight"
        >
          Highlight: {{ props.highlightSrc ?? '*' }} →
          {{ props.highlightDst ?? '*' }}
        </v-chip>
        <v-spacer />
        <span class="toolbar-summary text-caption text-medium-emphasis">
          {{ summary.visible }} of {{ summary.total }} edges
          <template v-if="hasDraftDiff">
            · <span class="diff-added">+{{ summary.added }}</span>
            <span class="diff-removed">−{{ summary.removed }}</span>
          </template>
        </span>
      </div>

      <VueFlow
        :nodes="flowNodes"
        :edges="flowEdgesList"
        fit-view-on-init
        :default-viewport="{ x: 0, y: 0, zoom: 0.9 }"
        class="vue-flow-theme-default"
      >
        <template #node-entity="nodeProps">
          <Handle
            v-if="nodeProps.data.side === 'dst'"
            type="target"
            :position="Position.Left"
          />
          <div class="entity-node">
            <div class="entity-node-name">{{ nodeProps.data.selector }}</div>
            <div
              class="entity-node-meta"
              :class="{ 'entity-node-meta--unused': nodeProps.data.unused }"
            >
              {{ nodeProps.data.meta }}
            </div>
          </div>
          <Handle
            v-if="nodeProps.data.side === 'src'"
            type="source"
            :position="Position.Right"
          />
        </template>

        <Controls position="bottom-left" :show-fit-view="true" />

        <Panel position="top-right" class="graph-panel legend">
          <h3>Legend</h3>
          <ul>
            <li>
              <span class="legend-chip accept-all" />
              Allowed (any port)
            </li>
            <li>
              <span class="legend-chip accept-partial" />
              Restricted (ports/protocols)
            </li>
            <li>
              <span class="legend-chip deny" />
              Denied
            </li>
            <template v-if="hasDraftDiff">
              <li class="legend-divider">— draft vs saved —</li>
              <li>
                <span class="legend-chip added" />
                Added edge
              </li>
              <li>
                <span class="legend-chip removed" />
                Removed edge
              </li>
            </template>
          </ul>
        </Panel>

        <Panel
          v-if="selectedDisplayEdge"
          position="bottom-center"
          class="graph-panel details"
        >
          <h3>
            {{ selectedDisplayEdge.src }} → {{ selectedDisplayEdge.dst }}
            <v-chip
              :color="
                selectedDisplayEdge.status === 'deny'
                  ? 'error'
                  : selectedDisplayEdge.status === 'accept-all'
                    ? 'success'
                    : 'warning'
              "
              size="x-small"
              variant="tonal"
              class="ml-2"
            >
              {{
                selectedDisplayEdge.status === 'deny'
                  ? 'Denied'
                  : selectedDisplayEdge.status === 'accept-all'
                    ? 'Allowed'
                    : 'Restricted'
              }}
            </v-chip>
            <v-chip
              v-if="selectedDisplayEdge.diff !== 'unchanged'"
              :color="selectedDisplayEdge.diff === 'added' ? 'success' : 'error'"
              size="x-small"
              variant="outlined"
              class="ml-1"
            >
              {{ selectedDisplayEdge.diff }}
            </v-chip>
          </h3>
          <ul>
            <li
              v-for="(r, i) in selectedDisplayEdge.refs"
              :key="`${r.ruleIndex}-${i}`"
              class="rule-ref"
              @click="goToRule(r.ruleIndex)"
            >
              <span class="rule-ref-index">#{{ r.ruleIndex + 1 }}</span>
              <span
                :class="
                  r.action === 'deny' ? 'rule-ref-deny' : 'rule-ref-accept'
                "
              >
                {{ r.action }}
              </span>
              <span class="rule-ref-dst">{{ formatDst(r.dstEntry) }}</span>
              <span class="rule-ref-open">open ↗</span>
            </li>
          </ul>
        </Panel>
      </VueFlow>
    </template>
  </div>
</template>

<style scoped>
.entity-node {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  pointer-events: none;
}

.entity-node-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  word-break: break-all;
}

.entity-node-meta {
  font-size: 11px;
  font-weight: 400;
  line-height: 1.2;
  opacity: 0.65;
  letter-spacing: 0.2px;
}

.entity-node-meta--unused {
  color: #ffb300;
  opacity: 0.85;
  font-style: italic;
}

.connectivity-graph {
  min-height: 520px;
  height: calc(100vh - 260px);
  width: 100%;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  background: rgb(var(--v-theme-surface));
  display: flex;
  flex-direction: column;
}

.graph-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgb(var(--v-theme-surface));
  flex-wrap: wrap;
}

.toolbar-search {
  flex: 0 0 240px;
}

.toolbar-switch {
  flex: 0 0 auto;
}

.toolbar-summary {
  white-space: nowrap;
}

.diff-added {
  color: #4caf50;
  margin-left: 4px;
}

.diff-removed {
  color: #f44336;
  margin-left: 4px;
}

.graph-loader,
.graph-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 520px;
  flex: 1;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 14px;
}

.graph-panel {
  background: rgba(var(--v-theme-surface), 0.95);
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 10px 14px;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  min-width: 180px;
  font-size: 12px;
  line-height: 17px;
}

.graph-panel h3 {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.legend ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.legend li {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.legend-divider {
  opacity: 0.6;
  font-size: 11px;
  font-style: italic;
  margin-top: 6px;
}

.legend-chip {
  display: inline-flex;
  width: 14px;
  height: 10px;
  border-radius: 2px;
}

.legend-chip.accept-all {
  background: #4caf50;
}

.legend-chip.accept-partial {
  background: repeating-linear-gradient(
    90deg,
    #ffb300 0 6px,
    transparent 6px 10px
  );
}

.legend-chip.deny {
  background: #f44336;
}

.legend-chip.added {
  background: repeating-linear-gradient(
    90deg,
    #4caf50 0 8px,
    transparent 8px 12px
  );
}

.legend-chip.removed {
  background: repeating-linear-gradient(
    90deg,
    #f44336 0 2px,
    transparent 2px 8px
  );
}

.details ul {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.rule-ref {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.1s ease;
}

.rule-ref:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.rule-ref-index {
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-variant-numeric: tabular-nums;
  min-width: 28px;
}

.rule-ref-accept {
  color: rgb(var(--v-theme-success));
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
}

.rule-ref-deny {
  color: rgb(var(--v-theme-error));
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
}

.rule-ref-dst {
  color: rgb(var(--v-theme-on-surface));
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule-ref-open {
  opacity: 0.55;
  font-size: 11px;
}

:deep(.vue-flow__node-default) {
  color: inherit;
  white-space: normal;
  line-height: 1.2;
}

:deep(.vue-flow__node-default:hover) {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
}

:deep(.vue-flow__edge) {
  cursor: pointer;
}

:deep(.vue-flow__edge-text) {
  font-family: inherit;
}

:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid rgb(var(--v-theme-surface));
  background: rgba(var(--v-theme-primary), 0.8);
}

:deep(.vue-flow__controls) {
  background: rgba(var(--v-theme-surface), 0.95);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

:deep(.vue-flow__controls-button) {
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
  fill: rgb(var(--v-theme-on-surface));
  width: 28px;
  height: 28px;
}

:deep(.vue-flow__controls-button:last-child) {
  border-bottom: none;
}

:deep(.vue-flow__controls-button:hover) {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

:deep(.vue-flow__controls-button svg) {
  fill: currentColor;
  max-width: 14px;
  max-height: 14px;
}
</style>
