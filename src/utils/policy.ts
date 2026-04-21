// Copyright (c) EZBLOCK INC. & AUTHORS
// SPDX-License-Identifier: BSD-3-Clause

import { parse as parseJsonc } from 'jsonc-parser'

export type RuleAction = 'accept' | 'deny'

export interface NormalizedDst {
  raw: string
  selector: string
  protocol: 'any' | 'tcp' | 'udp'
  portSpec: string
  blocksAll: boolean
  isPortSpecific: boolean
}

export interface NormalizedRule {
  index: number
  action: RuleAction
  src: string[]
  dst: NormalizedDst[]
  srcPosture?: string[]
  raw: unknown
}

export interface SshRule {
  index: number
  action: string
  src: string[]
  dst: string[]
  users: string[]
}

export interface DerpNode {
  name: string
  regionID: number
  hostName: string
  ipv4?: string
  ipv6?: string
  stunPort?: number
  derpPort?: number
  stunOnly?: boolean
  canPort80?: boolean
  insecureForTests?: boolean
}

export interface DerpRegion {
  id: number
  code: string
  name: string
  avoid?: boolean
  nodes: DerpNode[]
}

export interface DerpMap {
  omitDefaultRegions?: boolean
  regions: DerpRegion[]
}

export interface ParsedPolicy {
  ok: boolean
  error?: string
  acls: NormalizedRule[]
  ssh: SshRule[]
  groups: Record<string, string[]>
  tagOwners: Record<string, string[]>
  hosts: Record<string, string>
  derpMap: DerpMap
  rawSelectors: {
    sources: Set<string>
    destinations: Set<string>
  }
}

export function emptyPolicy(): ParsedPolicy {
  return {
    ok: true,
    acls: [],
    ssh: [],
    groups: {},
    tagOwners: {},
    hosts: {},
    derpMap: { regions: [] },
    rawSelectors: { sources: new Set(), destinations: new Set() },
  }
}

export function parsePolicy(policy?: string | null): ParsedPolicy {
  if (!policy || !policy.trim()) return emptyPolicy()

  try {
    const errors: { error: number; offset: number; length: number }[] = []
    const parsed = parseJsonc(policy, errors, {
      allowTrailingComma: true,
      disallowComments: false,
    }) as Record<string, unknown> | undefined

    if (errors.length || !parsed) {
      return {
        ...emptyPolicy(),
        ok: false,
        error:
          errors.length > 0
            ? `${errors.length} parse error${errors.length > 1 ? 's' : ''}`
            : 'Empty or invalid content',
      }
    }

    const acls = Array.isArray(parsed.acls) ? parsed.acls : []
    const normalizedAcls = acls
      .map((rule, index) => normalizeRule(rule, index))
      .filter((r): r is NormalizedRule => Boolean(r))

    const sshRules = Array.isArray(parsed.ssh) ? parsed.ssh : []
    const normalizedSsh: SshRule[] = sshRules
      .map((rule, index) => normalizeSsh(rule, index))
      .filter((r): r is SshRule => Boolean(r))

    const sources = new Set<string>()
    const destinations = new Set<string>()
    normalizedAcls.forEach((r) => {
      r.src.forEach((s) => sources.add(s))
      r.dst.forEach((d) => destinations.add(d.selector))
    })

    return {
      ok: true,
      acls: normalizedAcls,
      ssh: normalizedSsh,
      groups: normalizeStringArrayMap(parsed.groups),
      tagOwners: normalizeStringArrayMap(parsed.tagOwners),
      hosts: normalizeStringMap(parsed.hosts),
      derpMap: normalizeDerpMap(parsed.derpMap),
      rawSelectors: { sources, destinations },
    }
  } catch (err) {
    return {
      ...emptyPolicy(),
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function normalizeRule(candidate: unknown, index: number): NormalizedRule | undefined {
  if (
    !candidate ||
    typeof candidate !== 'object' ||
    !Array.isArray((candidate as any).src) ||
    !Array.isArray((candidate as any).dst)
  ) {
    return undefined
  }

  const action: RuleAction =
    String((candidate as any).action ?? '').toLowerCase() === 'deny' ? 'deny' : 'accept'

  return {
    index,
    action,
    src: (candidate as any).src.map(String),
    dst: (candidate as any).dst.map((entry: unknown) =>
      normalizeDstEntry(String(entry ?? '*')),
    ),
    srcPosture: Array.isArray((candidate as any).srcPosture)
      ? (candidate as any).srcPosture.map(String)
      : undefined,
    raw: candidate,
  }
}

function normalizeSsh(candidate: unknown, index: number): SshRule | undefined {
  if (!candidate || typeof candidate !== 'object') return undefined
  const c = candidate as any
  return {
    index,
    action: String(c.action ?? 'accept'),
    src: Array.isArray(c.src) ? c.src.map(String) : [],
    dst: Array.isArray(c.dst) ? c.dst.map(String) : [],
    users: Array.isArray(c.users) ? c.users.map(String) : [],
  }
}

export function normalizeDstEntry(entry: string): NormalizedDst {
  const trimmed = entry.trim()
  let selector = trimmed
  let protocol: 'any' | 'tcp' | 'udp' = 'any'
  let portSpec = '*'

  const parts = trimmed.split(':')
  if (parts.length >= 2) {
    const maybePort = parts[parts.length - 1] ?? ''
    const maybeProto = parts[parts.length - 2] ?? ''

    if (
      parts.length >= 3 &&
      isPortToken(maybePort) &&
      isProtocolToken(maybeProto) &&
      maybeProto !== '*'
    ) {
      selector = parts.slice(0, parts.length - 2).join(':')
      protocol = maybeProto as 'tcp' | 'udp'
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
  return (
    token === '*' ||
    /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/.test(token) ||
    token.includes(',')
  )
}

function isProtocolToken(token: string): boolean {
  return token === '*' || token === 'tcp' || token === 'udp'
}

function normalizeStringArrayMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, string[]> = {}
  Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
    if (Array.isArray(v)) out[k] = v.map(String)
  })
  return out
}

function normalizeDerpMap(value: unknown): DerpMap {
  const empty: DerpMap = { regions: [] }
  if (!value || typeof value !== 'object') return empty
  const m = value as Record<string, unknown>
  // Accept both "Regions" (tailscale canonical) and "regions" (lower-cased by humps).
  const regionsBlob =
    (m.Regions as Record<string, unknown> | undefined) ??
    (m.regions as Record<string, unknown> | undefined)
  const omit =
    (m.OmitDefaultRegions as boolean | undefined) ??
    (m.omitDefaultRegions as boolean | undefined)

  const regions: DerpRegion[] = []
  if (regionsBlob && typeof regionsBlob === 'object') {
    Object.entries(regionsBlob).forEach(([key, raw]) => {
      const region = normalizeDerpRegion(key, raw)
      if (region) regions.push(region)
    })
  }
  regions.sort((a, b) => a.id - b.id)
  return {
    omitDefaultRegions: omit === true ? true : undefined,
    regions,
  }
}

function normalizeDerpRegion(key: string, raw: unknown): DerpRegion | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const id = Number(r.RegionID ?? r.regionID ?? key)
  if (!Number.isFinite(id)) return undefined
  const code = String(r.RegionCode ?? r.regionCode ?? '')
  const name = String(r.RegionName ?? r.regionName ?? '')
  const avoid = Boolean(r.Avoid ?? r.avoid)
  const nodesRaw = (r.Nodes ?? r.nodes) as unknown
  const nodes: DerpNode[] = []
  if (Array.isArray(nodesRaw)) {
    nodesRaw.forEach((n) => {
      const node = normalizeDerpNode(n, id)
      if (node) nodes.push(node)
    })
  }
  return { id, code, name, avoid: avoid || undefined, nodes }
}

function normalizeDerpNode(raw: unknown, regionID: number): DerpNode | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const n = raw as Record<string, unknown>
  const name = String(n.Name ?? n.name ?? '')
  const hostName = String(n.HostName ?? n.hostName ?? '')
  if (!name && !hostName) return undefined
  const numOrUndef = (v: unknown): number | undefined => {
    const x = Number(v)
    return Number.isFinite(x) && x > 0 ? x : undefined
  }
  return {
    name,
    regionID: Number(n.RegionID ?? n.regionID ?? regionID) || regionID,
    hostName,
    ipv4: typeof (n.IPv4 ?? n.ipv4) === 'string' ? String(n.IPv4 ?? n.ipv4) : undefined,
    ipv6: typeof (n.IPv6 ?? n.ipv6) === 'string' ? String(n.IPv6 ?? n.ipv6) : undefined,
    stunPort: numOrUndef(n.STUNPort ?? n.stunPort),
    derpPort: numOrUndef(n.DERPPort ?? n.derpPort),
    stunOnly: (n.STUNOnly ?? n.stunOnly) === true ? true : undefined,
    canPort80: (n.CanPort80 ?? n.canPort80) === true ? true : undefined,
    insecureForTests:
      (n.InsecureForTests ?? n.insecureForTests) === true ? true : undefined,
  }
}

function normalizeStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {}
  const out: Record<string, string> = {}
  Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
    if (typeof v === 'string') out[k] = v
  })
  return out
}

export function formatDst(dst: NormalizedDst): string {
  const parts: string[] = [dst.selector || '*']
  if (dst.protocol !== 'any') parts.push(dst.protocol.toUpperCase())
  if (dst.portSpec && dst.portSpec !== '*') parts.push(`:${dst.portSpec}`)
  else if (dst.protocol !== 'any') parts.push(':*')
  return parts.join(' ')
}

export function selectorKind(selector: string): string {
  const s = selector.trim()
  if (s === '*') return 'wildcard'
  if (s.startsWith('tag:')) return 'tag'
  if (s.startsWith('group:')) return 'group'
  if (s.startsWith('autogroup:')) return 'autogroup'
  if (s.startsWith('user:') || s.includes('@')) return 'user'
  if (/^\d+\.\d+\.\d+\.\d+(\/\d+)?$/.test(s)) return 'cidr'
  if (/^[0-9a-f:]+(\/\d+)?$/i.test(s) && s.includes(':')) return 'cidr'
  return 'host'
}
