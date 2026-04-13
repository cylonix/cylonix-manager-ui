<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { V1ApiKey } from '@/clients/headscale/api'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useServerTable } from '@/composables/useServerTable'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'ID', key: 'id' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Network Domain', key: 'network' },
  {
    title: 'Prefix',
    key: 'prefix',
    value: (item: any) => item.prefix.substring(0, 5),
  },
  {
    title: 'Expiration',
    key: 'expiration',
    value: (item: any) => shortTs(item.expiration),
  },
  {
    title: 'Created',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt),
  },
  {
    title: 'Last seen',
    key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen),
  },
  {
    title: 'User',
    key: 'user',
    value: (item: any) => item.user?.loginName,
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const note = ref('')
const search = ref('')

const store = useUserStore()
const { isAdmin, isSysAdmin, namespace, user } = storeToRefs(store)

const {
  alert,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<V1ApiKey>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options, sortBy, sortDesc }) => {
    let uID = user.value?.userID
    if (!uID) {
      throw new Error('Missing user ID.')
    }
    if (isAdmin.value) {
      uID = undefined
    }
    const ret = await vpnAPI.headscaleServiceListApiKeys(
      isAdmin.value ? undefined : uID,
      [],
      isSysAdmin.value ? undefined : namespace.value,
      undefined /* network */,
      undefined /* filterBy */,
      undefined /* filterValue */,
      sortBy,
      sortDesc,
      options.page,
      options.itemsPerPage
    )
    return {
      items: ret?.data.apiKeys ?? [],
      total: ret?.data.total ?? 0,
    }
  },
})

async function deleteItem(item: V1ApiKey) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.prefix) {
      return
    }
    await vpnAPI.headscaleServiceDeleteApiKey(item.prefix)
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted api key ${item.id} ${item.prefix}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmDeleteText(item: V1ApiKey): string {
  return `Delete api key with ID "${item.id} ${item.prefix}"?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-chip size="large">API Keys</v-chip>
      <RefreshButton @refresh="refresh" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
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
