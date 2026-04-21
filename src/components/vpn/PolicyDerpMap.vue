<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  mdiEarth,
  mdiServerNetwork,
  mdiAlertCircleOutline,
  mdiMagnify,
} from '@mdi/js'
import { parsePolicy, type DerpNode, type DerpRegion } from '@/utils/policy'

const props = defineProps<{
  policy?: string | null
}>()

const search = ref('')

const parsed = computed(() => parsePolicy(props.policy))
const derp = computed(() => parsed.value.derpMap)

const filteredRegions = computed<DerpRegion[]>(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return derp.value.regions
  return derp.value.regions.filter((r) => {
    if (
      r.code.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      String(r.id).includes(q)
    ) {
      return true
    }
    return r.nodes.some(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        n.hostName.toLowerCase().includes(q) ||
        (n.ipv4 ?? '').toLowerCase().includes(q) ||
        (n.ipv6 ?? '').toLowerCase().includes(q),
    )
  })
})

const summary = computed(() => {
  const regions = derp.value.regions
  return {
    regions: regions.length,
    nodes: regions.reduce((sum, r) => sum + r.nodes.length, 0),
    avoid: regions.filter((r) => r.avoid).length,
  }
})

function nodeDetail(n: DerpNode): string {
  const parts: string[] = []
  if (n.hostName) parts.push(n.hostName)
  if (n.ipv4) parts.push(n.ipv4)
  if (n.ipv6) parts.push(`[${n.ipv6}]`)
  return parts.join(' · ')
}

function portsLabel(n: DerpNode): string {
  const bits: string[] = []
  if (n.derpPort) bits.push(`DERP :${n.derpPort}`)
  if (n.stunPort) bits.push(`STUN :${n.stunPort}`)
  if (n.canPort80) bits.push(':80')
  return bits.join(' · ')
}
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
      Switch to the Editor tab to fix formatting.
    </v-alert>

    <v-row dense class="mb-2" align="center">
      <v-col cols="auto">
        <v-chip color="primary" variant="tonal" size="small" label>
          <v-icon :icon="mdiEarth" size="14" start />
          {{ summary.regions }} region{{ summary.regions === 1 ? '' : 's' }}
        </v-chip>
      </v-col>
      <v-col cols="auto">
        <v-chip color="info" variant="tonal" size="small" label>
          <v-icon :icon="mdiServerNetwork" size="14" start />
          {{ summary.nodes }} node{{ summary.nodes === 1 ? '' : 's' }}
        </v-chip>
      </v-col>
      <v-col v-if="summary.avoid" cols="auto">
        <v-chip color="warning" variant="tonal" size="small" label>
          <v-icon :icon="mdiAlertCircleOutline" size="14" start />
          {{ summary.avoid }} avoid
        </v-chip>
      </v-col>
      <v-col v-if="derp.omitDefaultRegions" cols="auto">
        <v-chip color="deep-purple" variant="tonal" size="small" label>
          Omit default regions
        </v-chip>
      </v-col>
      <v-spacer />
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          :prepend-inner-icon="mdiMagnify"
          label="Filter regions or hostnames"
          density="compact"
          variant="outlined"
          hide-details
          clearable
        />
      </v-col>
    </v-row>

    <div
      v-if="!summary.regions"
      class="empty-state"
    >
      No DERP regions configured. The mesh will use the default public relays
      unless <code>omitDefaultRegions</code> is set.
    </div>

    <div
      v-else-if="!filteredRegions.length"
      class="empty-state"
    >
      No regions or nodes match “{{ search }}”.
    </div>

    <v-row v-else dense>
      <v-col
        v-for="region in filteredRegions"
        :key="region.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          variant="outlined"
          class="derp-region-card"
          :class="{ 'derp-region-card--avoid': region.avoid }"
        >
          <v-card-title class="d-flex align-center ga-2">
            <v-icon :icon="mdiEarth" size="18" color="primary" />
            <span class="text-subtitle-1 font-weight-medium">
              {{ region.code || `Region ${region.id}` }}
            </span>
            <v-chip size="x-small" variant="tonal" color="blue-grey" label>
              #{{ region.id }}
            </v-chip>
            <v-spacer />
            <v-chip
              v-if="region.avoid"
              color="warning"
              size="x-small"
              variant="tonal"
              :prepend-icon="mdiAlertCircleOutline"
            >
              avoid
            </v-chip>
          </v-card-title>
          <v-card-subtitle v-if="region.name" class="pb-2">
            {{ region.name }}
          </v-card-subtitle>
          <v-divider />
          <v-list density="compact" class="py-0">
            <v-list-item
              v-if="!region.nodes.length"
              class="text-caption text-medium-emphasis"
            >
              No nodes
            </v-list-item>
            <v-list-item
              v-for="n in region.nodes"
              :key="`${region.id}-${n.name}-${n.hostName}`"
              class="derp-node-item"
            >
              <template v-slot:prepend>
                <v-icon :icon="mdiServerNetwork" size="16" color="info" />
              </template>
              <v-list-item-title class="text-body-2">
                <span class="font-weight-medium">{{ n.name || '—' }}</span>
                <v-chip
                  v-if="n.stunOnly"
                  class="ml-2"
                  size="x-small"
                  variant="tonal"
                  color="amber"
                  label
                >
                  STUN-only
                </v-chip>
                <v-chip
                  v-if="n.insecureForTests"
                  class="ml-1"
                  size="x-small"
                  variant="tonal"
                  color="error"
                  label
                >
                  insecure
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ nodeDetail(n) || '—' }}
              </v-list-item-subtitle>
              <v-list-item-subtitle
                v-if="portsLabel(n)"
                class="text-caption derp-ports"
              >
                {{ portsLabel(n) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.empty-state {
  padding: 48px 16px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.65;
  font-size: 14px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 8px;
}

.empty-state code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 3px;
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.derp-region-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.derp-region-card--avoid {
  border-color: rgba(var(--v-theme-warning), 0.6);
}

.derp-ports {
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.derp-node-item {
  min-height: 48px;
}
</style>
