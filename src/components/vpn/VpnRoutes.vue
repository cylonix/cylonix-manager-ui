<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { decamelize } from '@cylonix/humps'
import { V1Route } from '@/clients/headscale/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
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

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<V1Route[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isAdmin, isNetworkAdmin, isSysAdmin, namespace, user } = storeToRefs(
  store
)

async function deleteItem(item: V1Route) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await vpnAPI.headscaleServiceDeleteRoute(item.id)
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted route ${item.prefix}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting route.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  const network = user.value?.networkDomain
  if (!isAdmin.value && !isNetworkAdmin.value) {
    alert.value = {
      on: true,
      text: 'Only Network Admins can view routes.',
    }
  }
  var sortBy = options?.sortBy?.[0]?.key
  if (sortBy) {
    sortBy = decamelize(sortBy)
  }
  if (sortBy === 'node') {
    sortBy = 'node_id'
  }

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceGetRoutes(
      undefined,
      [],
      isSysAdmin.value ? undefined : namespace.value,
      isAdmin.value ? undefined : network,
      undefined,
      undefined,
      sortBy,
      options.sortBy[0]?.order == 'desc' ? true : false,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.routes ?? []
    console.log('routes:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading items.')
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
      <RefreshButton @refresh="loadItems(loadOptions)" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="isSysAdmin ? adminViewHeaders : headers"
      :hide-default-footer="itemsPerPage >= totalItems"
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
        <v-icon v-if="item.advertised" color="green">mdi-check</v-icon>
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-icon v-if="item.enabled" color="green">mdi-check</v-icon>
      </template>
      <template v-slot:item.primary="{ item }">
        <v-icon v-if="item.isPrimary" color="green">mdi-check</v-icon>
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
