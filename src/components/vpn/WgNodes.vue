<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { WgAdminStateState, WgNode } from '@/clients/manager/api'
import { tryRequest, wgAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { compactList, hexToBase64 } from '@/plugins/utils'
import { useServerTable } from '@/composables/useServerTable'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'ID', key: 'id', align: 'center' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Name', key: 'name' },
  { title: 'Public key', key: 'publicKey', align: 'center' },
  {
    title: 'Addresses',
    key: 'addresses',
    value: (item: any) => compactList(item.addresses),
  },
  {
    title: 'Allowed IPs',
    key: 'allowedIps',
    value: (item: any) => compactList(item.allowedIps),
  },
  {
    title: 'Endpoints',
    key: 'endpoints',
    value: (item: any) => compactList(item.endpoints),
  },
  { title: 'Online', key: 'online', align: 'center' },
  {
    title: 'Last seen',
    key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen),
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const note = ref('')
const search = ref('')

const store = useUserStore()
const { isAdmin } = storeToRefs(store)

const {
  alert,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<WgNode>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options }) => {
    if (!isAdmin.value) {
      throw new Error('Operation is only allowed for administrators.')
    }
    const ret = await wgAPI.listWgNodes([], options.page, options.itemsPerPage)
    return {
      items: ret?.data.items ?? [],
      total: ret?.data.total ?? 0,
    }
  },
})

function shortID(id: string | undefined): string | undefined {
  return id?.substring(0)
}

function name(item: WgNode): string {
  return item.name
}

async function deleteItem(item: WgNode) {
  loading.value = true
  const ret = await tryRequest(async () => {
    await wgAPI.deleteWgNodes([item.id])
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `Deleted wireguard node ${name(item)}/${item.namespace}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

async function setAdminState(item: WgNode, down: boolean) {
  loading.value = true
  const state = down ? WgAdminStateState.Down : WgAdminStateState.Up
  const ret = await tryRequest(async () => {
    await wgAPI.setWgNodeAdminState(item.id, { state })
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `${down ? 'Shut down' : 'Brought up'} wireguard gateway ${name(item)}/${item.namespace}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmDeleteText(item: WgNode): string {
  return (
    `Delete wireguard gateway "${item.name}/${item.namespace}" with ID ` +
    `"${shortID(item.id)}"?`
  )
}
</script>
<template>
  <v-container class="ma-6" fluid>
    <Alert v-model="alert"></Alert>
    <v-chip size="large">WireGuard gateways</v-chip>
    <v-row align="center" justify="end">
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
      <template v-slot:item.id="{ item }">
        <ShortenTextChip :text="item.id"></ShortenTextChip>
      </template>
      <template v-slot:item.publicKey="{ item }">
        <ShortenTextChip
          :text="hexToBase64(item.publicKey, true)"
        ></ShortenTextChip>
      </template>

      <template v-slot:item.online="{ item }">
        <v-chip :color="item.online ? 'green' : 'grey'">
          {{ item.online ? 'Online' : 'Offline' }}
        </v-chip>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          class="mr-2"
          size="small"
          variant="tonal"
          :color="'orange'"
          :prepend-icon="'mdi-power'"
          @click="setAdminState(item, true)"
        >
          Shut down
        </v-btn>
        <v-btn
          class="mr-2"
          size="small"
          variant="tonal"
          :color="'green'"
          :prepend-icon="'mdi-power-on'"
          @click="setAdminState(item, false)"
        >
          Bring up
        </v-btn>
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
