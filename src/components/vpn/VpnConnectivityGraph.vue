<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { parse as parseJsonc } from 'jsonc-parser'
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

import { useTheme } from 'vuetify'
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

const props = defineProps<{
  nodes: V1Node[]
  policy?: string | null
  loading?: boolean
}>()

type ConnectivityStatus = 'allowed' | 'partial' | 'blocked'

interface NormalizedDst {
  raw: string
  selector: string
  protocol: 'any' | 'tcp' | 'udp'
  portSpec: string
  blocksAll: boolean
  isPortSpecific: boolean
}

interface NormalizedRule {
  action: 'accept' | 'deny'
  src: string[]
  dst: NormalizedDst[]
  raw: unknown
}

interface EdgeInfo {
  status: ConnectivityStatus
  label: string
  reasons: string[]
  matches: NormalizedDst[]
}

const flowNodes = shallowRef<FlowNode[]>([])
const flowEdges = shallowRef<FlowEdge[]>([])
const selectedEdgeId = ref<string>()
const centerNodeId = ref<string>()
const paneReady = ref(false)

const { fitView, onPaneReady, onEdgeClick, onPaneClick, onNodeClick } = useVueFlow()

onPaneReady(async () => {
  paneReady.value = true
  await nextTick()
  if (flowNodes.value.length) {
    fitView({ padding: 0.2, duration: 200 })
  }
})

onEdgeClick(({ edge }) => {
  selectedEdgeId.value = edge?.id
})

onNodeClick(({ node }) => {
  if (node.id !== centerNodeId.value) {
    centerNodeId.value = node.id
  }
})

onPaneClick(() => {
  selectedEdgeId.value = undefined
})

const edgeStyles: Record<ConnectivityStatus, FlowEdge['style']> = {
  allowed: { stroke: '#4caf50', strokeWidth: 1, opacity: 0.85 },
  partial: {
    stroke: '#ffb300',
    strokeWidth: 1,
    strokeDasharray: '8 4',
    opacity: 0.9,
  },
  blocked: { stroke: '#f44336', strokeWidth: 1, opacity: 0.95 },
}

const selectedEdge = computed(() =>
  flowEdges.value.find((edge) => edge.id === selectedEdgeId.value)
)

const nodeOptions = computed(() => {
  return props.nodes.map((node, index) => ({
    id: resolveNodeId(node, index),
    label: formatNodeName(node),
  }))
})

// Initialize center node to first node
watch(
  () => props.nodes,
  (nodes) => {
    if (nodes.length && !centerNodeId.value && nodes[0]) {
      centerNodeId.value = resolveNodeId(nodes[0], 0)
    }
  },
  { immediate: true }
)

watch(
  () => [props.nodes, props.policy, centerNodeId.value] as const,
  async ([nodes, policy, centerId]) => {
    if (!centerId || !nodes.length) {
      flowNodes.value = []
      flowEdges.value = []
      return
    }

    const normalizedRules = parsePolicy(policy)
    const centerIndex = nodes.findIndex(
      (node, idx) => resolveNodeId(node, idx) === centerId
    )

    if (centerIndex === -1) return

    flowNodes.value = buildRadialNodes(nodes, centerIndex)
    flowEdges.value = buildRadialEdges(nodes, centerIndex, normalizedRules)

    await nextTick()
    if (paneReady.value) {
      fitView({ padding: 0.2, duration: 200 })
    }
  },
  { immediate: true, deep: true }
)

function buildRadialNodes(nodes: V1Node[], centerIndex: number): FlowNode[] {
  const result: FlowNode[] = []
  const centerNode = nodes[centerIndex]
  if (!centerNode) return result

  const centerX = 500
  const centerY = 600 // Changed back to a reasonable fixed value
  const spacing = 350 // Distance from center to sides
  const centerNodeHeight = 240 // Increased height for center node

  // Add center node with increased height
  result.push({
    id: resolveNodeId(centerNode, centerIndex),
    label: formatNodeName(centerNode),
    position: { x: centerX - 90, y: centerY - centerNodeHeight / 2 },
    data: {
      node: centerNode,
      isCenter: true,
      fullLabel: formatNodeLabel(centerNode)
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    style: {
      width: 180,
      height: `${centerNodeHeight}px`,
      borderRadius: '16px',
      padding: '16px',
      border: '3px solid var(--v-theme-primary)',
      background: 'var(--v-theme-primary-container)',
      color: 'var(--v-theme-on-primary-container)',
      boxShadow: isDark
        ? '0 8px 32px rgba(0,0,0,0.50)'
        : '0 8px 32px rgba(0,0,0,0.12)',
      fontSize: '15px',
      lineHeight: '20px',
      fontWeight: 600,
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  })

  // Distribute peer nodes on 2 sides: left and right
  const peerNodes = nodes.filter((_, idx) => idx !== centerIndex)
  const nodesPerSide = Math.ceil(peerNodes.length / 2)

  const sides = [
    {
      name: 'left',
      isLeftSide: true,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      getPosition: (index: number, total: number) => ({
        x: centerX - spacing - 90,
        y: centerY - 30 + ((index - (total - 1) / 2) * 100)
      })
    },
    {
      name: 'right',
      isLeftSide: false,
      sourcePosition: Position.Left,
      targetPosition: Position.Right,
      getPosition: (index: number, total: number) => ({
        x: centerX + spacing - 90,
        y: centerY - 30 + ((index - (total - 1) / 2) * 100)
      })
    },
  ]

  peerNodes.forEach((node, index) => {
    const actualIndex = nodes.findIndex((n) => n === node)
    const sideIndex = Math.floor(index / nodesPerSide)
    const positionInSide = index % nodesPerSide
    const side = sides[Math.min(sideIndex, 1)]

    if (!side) return

    // Calculate how many nodes are on this side
    const startIdx = sideIndex * nodesPerSide
    const endIdx = Math.min((sideIndex + 1) * nodesPerSide, peerNodes.length)
    const nodesOnThisSide = endIdx - startIdx

    const position = side.getPosition(positionInSide, nodesOnThisSide)

    result.push({
      id: resolveNodeId(node, actualIndex),
      label: formatNodeName(node),
      position,
      sourcePosition: side.sourcePosition,
      targetPosition: side.targetPosition,
      data: {
        node,
        isCenter: false,
        isLeftSide: side.isLeftSide,
        fullLabel: formatNodeLabel(node)
      },
      style: {
        width: 180,
        borderRadius: '16px',
        padding: '12px',
        border: '1px solid var(--v-theme-primary)',
        background: 'var(--v-theme-surface)',
        color: 'var(--v-theme-on-surface)',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.50)'
          : '0 4px 24px rgba(0,0,0,0.08)',
        fontSize: '14px',
        lineHeight: '18px',
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
      },
    })
  })

  return result
}

function buildRadialEdges(
  nodes: V1Node[],
  centerIndex: number,
  rules: NormalizedRule[]
): FlowEdge[] {
  const edges: FlowEdge[] = []
  const centerNode = nodes[centerIndex]
  if (!centerNode) return edges

  const centerId = resolveNodeId(centerNode, centerIndex)

  // Separate nodes by side
  const peerNodes = nodes.filter((_, idx) => idx !== centerIndex)
  const nodesPerSide = Math.ceil(peerNodes.length / 2)
  const leftNodes: Array<{ node: V1Node; index: number }> = []
  const rightNodes: Array<{ node: V1Node; index: number }> = []

  peerNodes.forEach((peerNode, index) => {
    const actualIndex = nodes.findIndex((n) => n === peerNode)
    const sideIndex = Math.floor(index / nodesPerSide)

    if (sideIndex === 0) {
      leftNodes.push({ node: peerNode, index: actualIndex })
    } else {
      rightNodes.push({ node: peerNode, index: actualIndex })
    }
  })

  // Create edges for left side nodes (bidirectional with separate lines)
  leftNodes.forEach((peerNode, peerIndex) => {
    const peerId = resolveNodeId(peerNode.node, peerNode.index)
    if (!peerId || peerId === centerId) return

    // Left to Center (incoming to center) - uses bottom handles
    const incomingInfo = evaluateEdge(peerNode.node, centerNode, rules)
    edges.push({
      id: `${peerId}__${centerId}_in`,
      source: peerId,
      target: centerId,
      sourceHandle: 'right-out',
      targetHandle: `left-in-${peerIndex}`,
      type: 'default',
      markerEnd: MarkerType.ArrowClosed,
      animated: incomingInfo.status === 'partial',
      style: {
        ...edgeStyles[incomingInfo.status],
        strokeLinecap: 'round',
      },
      data: {
        status: incomingInfo.status,
        reasons: incomingInfo.reasons,
        direction: 'Incoming',
      },
    })

    // Center to Left (outgoing from center) - uses top handles
    const outgoingInfo = evaluateEdge(centerNode, peerNode.node, rules)
    edges.push({
      id: `${centerId}__${peerId}_out`,
      source: centerId,
      target: peerId,
      sourceHandle: `left-out-${peerIndex}`,
      targetHandle: 'right-in',
      type: 'default',
      markerEnd: MarkerType.ArrowClosed,
      animated: outgoingInfo.status === 'partial',
      style: {
        ...edgeStyles[outgoingInfo.status],
        strokeLinecap: 'round',
      },
      data: {
        status: outgoingInfo.status,
        reasons: outgoingInfo.reasons,
        direction: 'Outgoing',
      },
    })
  })

  // Create edges for right side nodes (bidirectional with separate lines)
  rightNodes.forEach((peerNode, peerIndex) => {
    const peerId = resolveNodeId(peerNode.node, peerNode.index)
    if (!peerId || peerId === centerId) return

    // Center to Right (outgoing from center) - uses top handles
    const outgoingInfo = evaluateEdge(centerNode, peerNode.node, rules)
    edges.push({
      id: `${centerId}__${peerId}_out`,
      source: centerId,
      target: peerId,
      sourceHandle: `right-out-${peerIndex}`,
      targetHandle: 'left-in',
      type: 'default',
      markerEnd: MarkerType.ArrowClosed,
      animated: outgoingInfo.status === 'partial',
      style: {
        ...edgeStyles[outgoingInfo.status],
        strokeLinecap: 'round',
      },
      data: {
        status: outgoingInfo.status,
        reasons: outgoingInfo.reasons,
        direction: 'Outgoing',
      },
    })

    // Right to Center (incoming to center) - uses bottom handles
    const incomingInfo = evaluateEdge(peerNode.node, centerNode, rules)
    edges.push({
      id: `${peerId}__${centerId}_in`,
      source: peerId,
      target: centerId,
      sourceHandle: 'left-out',
      targetHandle: `right-in-${peerIndex}`,
      type: 'default',
      markerEnd: MarkerType.ArrowClosed,
      animated: incomingInfo.status === 'partial',
      style: {
        ...edgeStyles[incomingInfo.status],
        strokeLinecap: 'round',
      },
      data: {
        status: incomingInfo.status,
        reasons: incomingInfo.reasons,
        direction: 'Incoming',
      },
    })
  })

  return edges
}

function evaluateEdge(
  nodeA: V1Node,
  nodeB: V1Node,
  rules: NormalizedRule[]
): EdgeInfo {
  const matches = findDenyMatches(nodeA, nodeB, rules)

  if (!matches.length) {
    return { status: 'allowed', label: 'Allowed', reasons: [], matches }
  }

  const hasFullBlock = matches.some((match) => match.blocksAll)

  return {
    status: hasFullBlock ? 'blocked' : 'partial',
    label: hasFullBlock ? 'Blocked' : 'Restricted',
    reasons: matches.map((match) =>
      [
        `${match.selector}`,
        match.protocol !== 'any' ? `${match.protocol.toUpperCase()}` : '',
        match.portSpec !== '*' ? `ports ${match.portSpec}` : 'all ports',
      ]
        .filter(Boolean)
        .join(' · ')
    ),
    matches,
  }
}

function findDenyMatches(
  srcNode: V1Node,
  dstNode: V1Node,
  rules: NormalizedRule[]
): NormalizedDst[] {
  return rules
    .filter((rule) => rule.action === 'deny' && matchesSelectors(rule.src, srcNode))
    .flatMap((rule) => rule.dst.filter((dst) => matchesDestination(dst, dstNode)))
}

function parsePolicy(policy?: string | null): NormalizedRule[] {
  if (!policy) return []

  try {
    const parsed = parseJsonc(policy, [], {
      allowTrailingComma: true,
      disallowComments: false,
    }) as Record<string, unknown> | undefined

    const aclRules = Array.isArray(parsed?.acls) ? parsed?.acls : []
    return aclRules
      .map((rule) => normalizeRule(rule))
      .filter((rule): rule is NormalizedRule => Boolean(rule))
  } catch (err) {
    console.warn('Failed to parse policy for connectivity graph:', err)
    return []
  }
}

function normalizeRule(candidate: unknown): NormalizedRule | undefined {
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    !Array.isArray((candidate as any).src) ||
    !Array.isArray((candidate as any).dst)
  ) {
    return undefined
  }

  const action =
    String((candidate as any).action ?? '').toLowerCase() === 'deny' ? 'deny' : 'accept'

  return {
    action,
    src: (candidate as any).src.map(String),
    dst: (candidate as any).dst.map((entry: unknown) =>
      normalizeDstEntry(String(entry ?? '*'))
    ),
    raw: candidate,
  }
}

function normalizeDstEntry(entry: string): NormalizedDst {
  const trimmed = entry.trim()
  let selector = trimmed
  let protocol: 'any' | 'tcp' | 'udp' = 'any'
  let portSpec = '*'

  const parts = trimmed.split(':')

  if (parts.length >= 2) {
    const maybePort = parts[parts.length - 1] ?? ''
    const maybeProto = parts[parts.length - 2] ?? ''

    if (isPortToken(maybePort) && isProtocolToken(maybeProto)) {
      selector = parts.slice(0, parts.length - 2).join(':')
      protocol = maybeProto === '*' ? 'any' : (maybeProto as 'tcp' | 'udp')
      portSpec = maybePort
    } else if (isPortToken(maybePort)) {
      selector = parts.slice(0, parts.length - 1).join(':')
      portSpec = maybePort
    }
  }

  return {
    raw: trimmed,
    selector,
    protocol,
    portSpec,
    isPortSpecific: portSpec !== '*' && portSpec !== '',
    blocksAll: protocol === 'any' && (portSpec === '*' || portSpec === ''),
  }
}

function isPortToken(token: string): boolean {
  return token === '*' || /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/.test(token) || token.includes(',')
}

function isProtocolToken(token: string): boolean {
  return token === '*' || token === 'tcp' || token === 'udp'
}

function matchesSelectors(selectors: string[], node: V1Node): boolean {
  return selectors.some((selector) => nodeMatchesSelector(node, selector))
}

function matchesDestination(dst: NormalizedDst, node: V1Node): boolean {
  if (!nodeMatchesSelector(node, dst.selector)) return false
  return true
}

function nodeMatchesSelector(node: V1Node, selector: string): boolean {
  const trimmed = selector.trim()
  if (!trimmed || trimmed === '*' || trimmed === 'autogroup:members') return true

  if (trimmed.startsWith('tag:')) {
    const tag = trimmed.slice(4)
    const tags = extractStringArray(node, ['tags', 'validTags', 'forcedTags', 'advertisedTags'])
    return tags.some((candidate) => [candidate, candidate?.replace(/^tag:/, '')].includes(tag))
  }

  if (trimmed.startsWith('user:')) {
    const expected = trimmed.slice(5)
    const userName = String((node as any).user?.name ?? (node as any).user?.loginName ?? '')
    return userName === expected || userName.endsWith(expected)
  }

  if (trimmed.includes('@')) {
    const userName = String((node as any).user?.loginName ?? (node as any).user?.name ?? '')
    return userName === trimmed
  }

  const ips = extractStringArray(node, ['ipAddresses', 'addresses'])
  if (ips.includes(trimmed)) return true

  const nodeName = String((node as any).givenName ?? (node as any).hostname ?? '')
  if (nodeName === trimmed) return true

  return false
}

function extractStringArray(node: V1Node, keys: string[]): string[] {
  const values: string[] = []
  keys.forEach((key) => {
    const candidate = (node as Record<string, unknown>)[key]
    if (Array.isArray(candidate)) {
      candidate.forEach((entry) => {
        if (typeof entry === 'string') values.push(entry)
      })
    }
  })
  return values
}

function resolveNodeId(node: V1Node, fallbackIndex: number): string {
  return (
    String((node as any).id ?? (node as any).nodeId ?? (node as any).machineKey) ||
    String((node as any).givenName ?? `node-${fallbackIndex}`)
  )
}

function formatNodeLabel(node: V1Node): string {
  const name = (node as any).givenName ?? (node as any).hostname ?? 'Unnamed node'
  const user = (node as any).user?.name ?? (node as any).user?.loginName ?? ''
  const ips = extractStringArray(node, ['ipAddresses', 'addresses'])
  return [name, user && `• ${user}`, ips[0] && `• ${ips[0]}`].filter(Boolean).join('\n')
}

function formatNodeName(node: V1Node): string {
  return (node as any).givenName ?? (node as any).hostname ?? 'Unnamed node'
}
</script>

<template>
  <div class="connectivity-graph">
    <div v-if="loading" class="graph-loader">
      <v-skeleton-loader type="image" />
    </div>

    <div v-else-if="!nodes.length" class="graph-empty">
      No nodes available to render connectivity.
    </div>

    <template v-else>
      <div class="graph-controls">
        <v-select
          v-model="centerNodeId"
          :items="nodeOptions"
          item-title="label"
          item-value="id"
          label="Select Center Node"
          density="compact"
          hide-details
          variant="outlined"
          class="node-selector"
        />
      </div>

      <VueFlow
        :nodes="flowNodes"
        :edges="flowEdges"
        fit-view-on-init
        class="vue-flow-theme-default"
      >
        <Controls position="top-left" :show-fit-view="true" />

        <template #node-default="{ data }">
          <v-tooltip location="top" :text="data.fullLabel">
            <template v-slot:activator="{ props: tooltipProps }">
              <div class="custom-node" v-bind="tooltipProps">
                {{ data.node?.givenName ?? data.node?.hostname ?? 'Unnamed' }}

                <!-- Handles for center node -->
                <template v-if="data.isCenter">
                  <!-- Left side handles for connections from/to left nodes -->
                  <template
                    v-for="i in Math.ceil((nodes.length - 1) / 2)"
                    :key="`left-${i - 1}`"
                  >
                    <!-- Outgoing handle (top offset) -->
                    <Handle
                      :id="`left-out-${i - 1}`"
                      type="source"
                      :position="Position.Left"
                      :style="{
                        top: `${
                          (i / (Math.ceil((nodes.length - 1) / 2) + 1)) * 100 -
                          3
                        }%`,
                        background: '#4caf50',
                      }"
                    />
                    <!-- Incoming handle (bottom offset) -->
                    <Handle
                      :id="`left-in-${i - 1}`"
                      type="target"
                      :position="Position.Left"
                      :style="{
                        top: `${
                          (i / (Math.ceil((nodes.length - 1) / 2) + 1)) * 100 +
                          3
                        }%`,
                        background: '#2196f3',
                      }"
                    />
                  </template>
                  <!-- Right side handles for connections from/to right nodes -->
                  <template
                    v-for="i in Math.floor((nodes.length - 1) / 2)"
                    :key="`right-${i - 1}`"
                  >
                    <!-- Outgoing handle (top offset) -->
                    <Handle
                      :id="`right-out-${i - 1}`"
                      type="source"
                      :position="Position.Right"
                      :style="{
                        top: `${
                          (i / (Math.floor((nodes.length - 1) / 2) + 1)) * 100 -
                          3
                        }%`,
                        background: '#4caf50',
                      }"
                    />
                    <!-- Incoming handle (bottom offset) -->
                    <Handle
                      :id="`right-in-${i - 1}`"
                      type="target"
                      :position="Position.Right"
                      :style="{
                        top: `${
                          (i / (Math.floor((nodes.length - 1) / 2) + 1)) * 100 +
                          3
                        }%`,
                        background: '#2196f3',
                      }"
                    />
                  </template>
                </template>
                <!-- Handles for peer nodes - only show right side handles for left nodes, left side for right nodes -->
                <template v-else>
                  <!-- For left side nodes, only show right handles -->
                  <template v-if="data.isLeftSide">
                    <Handle
                      id="right-out"
                      type="source"
                      :position="Position.Right"
                      :style="{ top: '45%', background: '#4caf50' }"
                    />
                    <Handle
                      id="right-in"
                      type="target"
                      :position="Position.Right"
                      :style="{ top: '55%', background: '#2196f3' }"
                    />
                  </template>
                  <!-- For right side nodes, only show left handles -->
                  <template v-else>
                    <Handle
                      id="left-out"
                      type="source"
                      :position="Position.Left"
                      :style="{ top: '45%', background: '#4caf50' }"
                    />
                    <Handle
                      id="left-in"
                      type="target"
                      :position="Position.Left"
                      :style="{ top: '55%', background: '#2196f3' }"
                    />
                  </template>
                </template>
              </div>
            </template>
          </v-tooltip>
        </template>

        <Panel position="top-right" class="graph-panel legend">
          <h3>Legend</h3>
          <ul>
            <li>
              <span class="legend-chip allowed"></span>
              Allowed
            </li>
            <li>
              <span class="legend-chip partial"></span>
              Restricted (ports/protocols)
            </li>
            <li>
              <span class="legend-chip blocked"></span>
              Blocked
            </li>
          </ul>
        </Panel>
        <Panel position="top-left" class="graph-panel legend">
          <p class="hint">
            Hover over nodes for details<br />Click peer nodes to recenter<br />Separate
            lines for each direction
          </p>
        </Panel>
        <Panel
          v-if="selectedEdge"
          position="bottom-center"
          class="graph-panel details"
        >
          <h3>
            Link status ({{ selectedEdge.data?.direction }}):
            {{
              (selectedEdge.data?.status === 'blocked' && 'Blocked') ||
              (selectedEdge.data?.status === 'partial' && 'Restricted') ||
              'Allowed'
            }}
          </h3>
          <ul v-if="selectedEdge.data?.reasons?.length">
            <li v-for="reason in selectedEdge.data.reasons" :key="reason">
              {{ reason }}
            </li>
          </ul>
          <p v-else>No blocking ACLs detected for this direction.</p>
        </Panel>
      </VueFlow>
    </template>
  </div>
</template>

<style scoped>
.connectivity-graph {
  min-height: 520px;
  height: calc(100vh);
  width: 100%;
  border: 1px solid var(--v-theme-outline-variant);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  background: rgb(var(--v-theme-surface));
}

.graph-controls {
  position: absolute;
  top: 16px;
  left: calc(50% - 180px);
  z-index: 10;
  background: var(--v-theme-surface);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.node-selector {
  min-width: 280px;
}

.graph-loader,
.graph-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 520px;
  color: var(--v-theme-on-surface-variant);
  font-size: 15px;
}

.custom-node {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  word-break: break-word;
  padding: 4px;
}

.graph-panel {
  background: rgba(18, 24, 38, 0.88);
  color: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.28);
  min-width: 180px;
  font-size: 13px;
  line-height: 18px;
}

.graph-panel h3 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.hint {
  margin-top: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.direction-status {
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.direction-status p {
  margin: 4px 0;
  font-size: 12px;
}

.legend ul,
.details ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.legend li,
.details li {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.legend-chip {
  display: inline-flex;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid transparent;
}

.legend-chip.allowed {
  background: #4caf50;
}

.legend-chip.partial {
  background: #ffb300;
}

.legend-chip.blocked {
  background: #f44336;
}

.details ul {
  max-height: 200px;
  overflow-y: auto;
}

.details li {
  align-items: flex-start;
}

:deep(.vue-flow__node-default) {
  color: inherit;
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.vue-flow__node-default:hover) {
  transform: scale(1.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  z-index: 100;
}

:deep(.vue-flow__edge) {
  cursor: pointer;
}

:deep(.vue-flow__edge:hover) {
  opacity: 1 !important;
}

:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
}
</style>
