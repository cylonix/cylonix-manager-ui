<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { mdiCheck } from '@mdi/js'
import { storeToRefs } from 'pinia'
import type { V1Node } from '@/clients/headscale/api'
import { tryRequest, vpnAPI } from '@/plugins/api'

// v0.28 headscale removed the routes table and GetRoutes RPC; routes now live
// on each node as availableRoutes (advertised) / approvedRoutes (enabled) /
// subnetRoutes (served). RouteRow flattens a node's routes into one table row
// per prefix so this admin table keeps working.
interface RouteRow {
  id: string
  node: V1Node
  prefix: string
  advertised: boolean
  enabled: boolean
  isPrimary: boolean
  namespace?: string
  network?: string
  createdAt?: string
  updatedAt?: string
}
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useServerTable, buildSortParams } from '@/composables/useServerTable'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'User', key: 'user', sortable: false },
  { title: 'Node', key: 'node' },
  { title: 'Prefix', key: 'prefix' },
  { title: 'Advertised', key: 'advertised' },
  { title: 'Enabled', key: 'enabled' },
  { title: 'Primary', key: 'primary' },
  {
    title: 'Created at',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt),
  },
  {
    title: 'Updated at',
    key: 'updatedAt',
    value: (item: any) => shortTs(item.updatedAt),
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const adminViewHeaders = ref([
  { title: 'ID', key: 'id' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Network Domain', key: 'network' },
  ...headers.value,
] as const)

const note = ref('')
const search = ref('')

const store = useUserStore()
const { isAdmin, isNetworkAdmin, isSysAdmin, namespace, user } = storeToRefs(
  store
)

const {
  alert,
  hideFooter,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<RouteRow>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options }) => {
    const network = user.value?.networkDomain
    if (!isAdmin.value && !isNetworkAdmin.value) {
      throw new Error('Only Network Admins can view routes.')
    }
    const { sortBy, sortDesc } = buildSortParams(options.sortBy)
    // List nodes for the tenant and flatten their routes. Fetch all in one
    // call (route-advertising nodes are few) and paginate the flattened rows
    // client-side, since pagination is per-route not per-node.
    const ret = await vpnAPI.headscaleServiceListNodes(
      undefined, // user
      [], // nodeIDList
      isSysAdmin.value ? undefined : namespace.value,
      isAdmin.value ? undefined : network,
      undefined, // onlineOnly
      undefined, // filterBy
      undefined, // filterValue
      sortBy,
      sortDesc,
      1, // page
      100000 // pageSize: all
    )
    const rows: RouteRow[] = []
    for (const node of ret?.data.nodes ?? []) {
      const avail = node.availableRoutes ?? []
      const approved = node.approvedRoutes ?? []
      const primary = node.subnetRoutes ?? []
      const prefixes = Array.from(new Set([...avail, ...approved]))
      for (const prefix of prefixes) {
        rows.push({
          id: `${node.id}-${prefix}`,
          node,
          prefix,
          advertised: avail.includes(prefix),
          enabled: approved.includes(prefix),
          isPrimary: primary.includes(prefix),
          namespace: node.namespace,
          network: node.networkDomain,
          createdAt: node.createdAt,
          updatedAt: node.lastSeen,
        })
      }
    }
    const start = (options.page - 1) * options.itemsPerPage
    return {
      items: rows.slice(start, start + options.itemsPerPage),
      total: rows.length,
    }
  },
})

// v0.28 has no per-route delete; "delete" unapproves the route on its node.
async function deleteItem(item: RouteRow) {
  loading.value = true
  const ret = await tryRequest(async () => {
    const id = item.node.id
    if (!id) {
      return
    }
    const routes = (item.node.approvedRoutes ?? []).filter(
      (p) => p !== item.prefix
    )
    await vpnAPI.headscaleServiceSetApprovedRoutes(id, { routes })
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `Disabled route ${item.prefix}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmDeleteText(item: RouteRow): string {
  return `Disable route "${item.prefix}" on ${item.node?.givenName}?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-chip size="large">Routes</v-chip>
      <RefreshButton @refresh="refresh" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="isSysAdmin ? adminViewHeaders : headers"
      :hide-default-footer="hideFooter"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:item.user="{ item }">
        <AbstractChip
          :label="item.node?.user?.loginName"
          :data="item.node?.user"
        ></AbstractChip>
      </template>
      <template v-slot:item.node="{ item }">
        <AbstractChip
          :label="item.node?.givenName"
          :data="item.node"
        ></AbstractChip>
      </template>

      <template v-slot:item.advertised="{ item }">
        <v-icon v-if="item.advertised" color="green" :icon="mdiCheck" />
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-icon v-if="item.enabled" color="green" :icon="mdiCheck" />
      </template>
      <template v-slot:item.primary="{ item }">
        <v-icon v-if="item.isPrimary" color="green" :icon="mdiCheck" />
      </template>
      <template v-slot:item.actions="{ item }">
        <DeleteButton
          v-model:note="note"
          :confirmDeleteText="confirmDeleteText(item)"
          @delete="deleteItem(item)"
        >
        </DeleteButton>
      </template>
    </v-data-table-server>
  </v-container>
</template>
