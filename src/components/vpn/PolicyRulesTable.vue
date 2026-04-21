<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import {
  mdiCheckCircle,
  mdiCloseCircle,
  mdiAccountGroup,
  mdiTag,
  mdiShieldLockOutline,
  mdiCloseCircleOutline,
} from '@mdi/js'
import {
  formatDst,
  parsePolicy,
  selectorKind,
  type NormalizedRule,
} from '@/utils/policy'

const props = defineProps<{
  policy?: string | null
  highlightRuleIndex?: number | null
  highlightSrc?: string | null
  highlightDst?: string | null
}>()

const emit = defineEmits<{
  (e: 'selectRule', index: number | null): void
  (e: 'clearHighlight'): void
}>()

const filterText = ref('')
const actionFilter = ref<'all' | 'accept' | 'deny'>('all')

const parsed = computed(() => parsePolicy(props.policy))

function ruleMatchesCell(
  rule: NormalizedRule,
  src: string | null | undefined,
  dst: string | null | undefined,
): boolean {
  if (!src && !dst) return true
  if (src && !rule.src.includes(src)) return false
  if (dst && !rule.dst.some((d) => d.selector === dst)) return false
  return true
}

const filteredRules = computed<NormalizedRule[]>(() => {
  const q = filterText.value.trim().toLowerCase()
  return parsed.value.acls.filter((rule) => {
    if (actionFilter.value !== 'all' && rule.action !== actionFilter.value) {
      return false
    }
    if (
      !ruleMatchesCell(rule, props.highlightSrc, props.highlightDst)
    ) {
      return false
    }
    if (!q) return true
    const haystack = [
      rule.action,
      ...rule.src,
      ...rule.dst.map((d) => formatDst(d)),
      ...(rule.srcPosture ?? []),
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

const hasCellHighlight = computed(
  () => !!(props.highlightSrc || props.highlightDst),
)

const rowRefs = ref<Record<number, HTMLElement | null>>({})

function setRowRef(index: number, el: Element | null) {
  rowRefs.value[index] = (el as HTMLElement) ?? null
}

watch(
  () => props.highlightRuleIndex,
  async (idx) => {
    if (idx == null) return
    await nextTick()
    rowRefs.value[idx]?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  },
)

function onRowClick(rule: NormalizedRule) {
  const next =
    props.highlightRuleIndex === rule.index ? null : rule.index
  emit('selectRule', next)
}

const summary = computed(() => {
  const total = parsed.value.acls.length
  const accept = parsed.value.acls.filter((r) => r.action === 'accept').length
  const deny = total - accept
  return {
    total,
    accept,
    deny,
    groups: Object.keys(parsed.value.groups).length,
    tags: Object.keys(parsed.value.tagOwners).length,
    hosts: Object.keys(parsed.value.hosts).length,
    ssh: parsed.value.ssh.length,
  }
})

function selectorColor(selector: string): string {
  switch (selectorKind(selector)) {
    case 'wildcard':
      return 'grey'
    case 'tag':
      return 'teal'
    case 'group':
      return 'deep-purple'
    case 'autogroup':
      return 'indigo'
    case 'user':
      return 'blue'
    case 'cidr':
      return 'orange'
    default:
      return 'blue-grey'
  }
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

    <!-- Summary chips -->
    <v-row dense class="mb-2">
      <v-col cols="auto">
        <v-chip color="primary" variant="tonal" size="small">
          {{ summary.total }} ACL rule{{ summary.total === 1 ? '' : 's' }}
        </v-chip>
      </v-col>
      <v-col cols="auto">
        <v-chip color="success" variant="tonal" size="small">
          <v-icon :icon="mdiCheckCircle" size="14" start />
          {{ summary.accept }} accept
        </v-chip>
      </v-col>
      <v-col cols="auto">
        <v-chip color="error" variant="tonal" size="small">
          <v-icon :icon="mdiCloseCircle" size="14" start />
          {{ summary.deny }} deny
        </v-chip>
      </v-col>
      <v-col v-if="summary.groups" cols="auto">
        <v-chip color="deep-purple" variant="tonal" size="small">
          <v-icon :icon="mdiAccountGroup" size="14" start />
          {{ summary.groups }} group{{ summary.groups === 1 ? '' : 's' }}
        </v-chip>
      </v-col>
      <v-col v-if="summary.tags" cols="auto">
        <v-chip color="teal" variant="tonal" size="small">
          <v-icon :icon="mdiTag" size="14" start />
          {{ summary.tags }} tag owner{{ summary.tags === 1 ? '' : 's' }}
        </v-chip>
      </v-col>
      <v-col v-if="summary.ssh" cols="auto">
        <v-chip color="blue-grey" variant="tonal" size="small">
          <v-icon :icon="mdiShieldLockOutline" size="14" start />
          {{ summary.ssh }} SSH rule{{ summary.ssh === 1 ? '' : 's' }}
        </v-chip>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-row dense class="mb-2" align="center">
      <v-col cols="12" md="5">
        <v-text-field
          v-model="filterText"
          label="Filter rules (src, dst, port…)"
          density="compact"
          variant="outlined"
          hide-details
          clearable
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-btn-toggle
          v-model="actionFilter"
          mandatory
          density="compact"
          color="primary"
          variant="outlined"
        >
          <v-btn value="all" size="small">All</v-btn>
          <v-btn value="accept" size="small">Accept</v-btn>
          <v-btn value="deny" size="small">Deny</v-btn>
        </v-btn-toggle>
      </v-col>
      <v-col cols="12" md="3" class="text-right text-caption text-medium-emphasis">
        Showing {{ filteredRules.length }} of {{ summary.total }}
      </v-col>
    </v-row>

    <v-row v-if="hasCellHighlight" dense align="center" class="mb-2">
      <v-col cols="auto">
        <v-chip
          color="primary"
          size="small"
          variant="tonal"
          :prepend-icon="mdiCloseCircleOutline"
          closable
          @click:close="emit('clearHighlight')"
        >
          Filtered by
          <strong class="mx-1">
            {{ highlightSrc ?? '*' }} → {{ highlightDst ?? '*' }}
          </strong>
        </v-chip>
      </v-col>
    </v-row>

    <!-- Rules table -->
    <v-card variant="outlined" class="mt-2">
      <v-table density="compact" hover>
        <thead>
          <tr>
            <th style="width: 48px" class="text-center">#</th>
            <th style="width: 96px">Action</th>
            <th>Source</th>
            <th>Destination</th>
            <th style="width: 140px">Posture</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredRules.length">
            <td colspan="5" class="text-center text-medium-emphasis py-6">
              {{ summary.total ? 'No rules match the filter.' : 'No ACL rules defined.' }}
            </td>
          </tr>
          <tr
            v-for="rule in filteredRules"
            :key="rule.index"
            :ref="(el) => setRowRef(rule.index, el as Element | null)"
            class="rule-row"
            :class="{ 'rule-row--active': highlightRuleIndex === rule.index }"
            @click="onRowClick(rule)"
          >
            <td class="text-center text-caption text-medium-emphasis">
              {{ rule.index + 1 }}
            </td>
            <td>
              <v-chip
                :color="rule.action === 'accept' ? 'success' : 'error'"
                variant="tonal"
                size="small"
                label
              >
                <v-icon
                  :icon="rule.action === 'accept' ? mdiCheckCircle : mdiCloseCircle"
                  size="14"
                  start
                />
                {{ rule.action }}
              </v-chip>
            </td>
            <td>
              <div class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="s in rule.src"
                  :key="s"
                  :color="selectorColor(s)"
                  variant="tonal"
                  size="x-small"
                  label
                >
                  {{ s }}
                </v-chip>
              </div>
            </td>
            <td>
              <div class="d-flex flex-wrap ga-1">
                <v-tooltip
                  v-for="d in rule.dst"
                  :key="d.raw"
                  location="top"
                  :text="d.raw"
                >
                  <template v-slot:activator="{ props: tipProps }">
                    <v-chip
                      v-bind="tipProps"
                      :color="selectorColor(d.selector)"
                      variant="tonal"
                      size="x-small"
                      label
                    >
                      {{ formatDst(d) }}
                    </v-chip>
                  </template>
                </v-tooltip>
              </div>
            </td>
            <td>
              <div
                v-if="rule.srcPosture?.length"
                class="d-flex flex-wrap ga-1"
              >
                <v-chip
                  v-for="p in rule.srcPosture"
                  :key="p"
                  color="amber"
                  variant="tonal"
                  size="x-small"
                  label
                >
                  {{ p }}
                </v-chip>
              </div>
              <span v-else class="text-caption text-medium-emphasis">—</span>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Groups & tag owners reference -->
    <v-row dense class="mt-4">
      <v-col v-if="summary.groups" cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon :icon="mdiAccountGroup" size="18" start />
            Groups
          </v-card-title>
          <v-card-text class="pt-0">
            <div
              v-for="(members, name) in parsed.groups"
              :key="name"
              class="mb-2"
            >
              <v-chip color="deep-purple" variant="tonal" size="small" label>
                {{ name }}
              </v-chip>
              <span class="text-caption text-medium-emphasis ml-2">
                {{ members.length }} member{{ members.length === 1 ? '' : 's' }}:
                {{ members.join(', ') }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="summary.tags" cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">
            <v-icon :icon="mdiTag" size="18" start />
            Tag owners
          </v-card-title>
          <v-card-text class="pt-0">
            <div
              v-for="(owners, tag) in parsed.tagOwners"
              :key="tag"
              class="mb-2"
            >
              <v-chip color="teal" variant="tonal" size="small" label>
                {{ tag }}
              </v-chip>
              <span class="text-caption text-medium-emphasis ml-2">
                owned by {{ owners.join(', ') }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.rule-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.rule-row--active {
  background: rgba(var(--v-theme-primary), 0.14) !important;
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
</style>
