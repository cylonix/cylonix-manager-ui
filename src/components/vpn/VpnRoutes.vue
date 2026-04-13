<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { mdiCheck } from '@mdi/js'
import { storeToRefs } from 'pinia'
import { V1Route } from '@/clients/headscale/api'
import { tryRequest, vpnAPI } from '@/plugins/api'
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
} = useServerTable<V1Route>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options }) => {
    const network = user.value?.networkDomain
    if (!isAdmin.value && !isNetworkAdmin.value) {
      throw new Error('Only Network Admins can view routes.')
    }
    // Custom sort: 'node' maps to 'node_id' on the backend
    let { sortBy, sortDesc } = buildSortParams(options.sortBy)
    if (sortBy) {
      sortBy = sortBy.replace(/\bnode\b/, 'node_id')
    }
    const ret = await vpnAPI.headscaleServiceGetRoutes(
      undefined,
      [],
      isSysAdmin.value ? undefined : namespace.value,
      isAdmin.value ? undefined : network,
      undefined,
      undefined,
      sortBy,
      sortDesc,
      options.page,
      options.itemsPerPage
    )
    return {
      items: ret?.data.routes ?? [],
      total: ret?.data.total ?? 0,
    }
  },
})

async function deleteItem(item: V1Route) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await vpnAPI.headscaleServiceDeleteRoute(item.id)
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted route ${item.prefix}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmDeleteText(item: V1Route): string {
  return `Delete route "${item.prefix}" from ${item.node?.givenName}?`
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
