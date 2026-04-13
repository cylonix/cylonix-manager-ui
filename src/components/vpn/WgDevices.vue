<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { WgDevice } from '@/clients/manager/api'
import { tryRequest, wgAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { compactList } from '@/plugins/utils'
import { useServerTable } from '@/composables/useServerTable'

const headers = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  {
    title: 'User ID',
    key: 'userID',
  },
  { title: 'Device ID', key: 'deviceID', align: 'center' },
  { title: 'Name', key: 'name' },
  { title: 'Public key', key: 'publicKey', align: 'center' },
  { title: 'Node ID', key: 'nodeID', align: 'center' },
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
    title: 'Last seen',
    Key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen),
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const note = ref('')
const search = ref('')
const onlineCount = ref(0)

const {
  alert,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<WgDevice>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options, sortBy, sortDesc }) => {
    const ret = await wgAPI.listVpnDevice(
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      options.page,
      options.itemsPerPage,
      sortBy,
      sortDesc
    )
    onlineCount.value = ret?.data.online ?? 0
    return {
      items: ret?.data.devices ?? [],
      total: ret?.data.total ?? 0,
    }
  },
})

function shortID(id: string | undefined): string | undefined {
  return id?.substring(0)
}

function name(item: WgDevice): string {
  return item.name
}

async function deleteItem(item: WgDevice) {
  loading.value = true
  const ret = await tryRequest(async () => {
    await wgAPI.deleteVpnDevices([item.deviceID])
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `Deleted wireguard device ${name(item)}/${item.namespace}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmDeleteText(item: WgDevice): string {
  return (
    `Delete wireguard device "${item.name}/${item.namespace}" with ID ` +
    `"${shortID(item.deviceID)}"?`
  )
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-chip size="large">WireGuard devices</v-chip>
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
      <template v-slot:item.userID="{ item }">
        <ShortenTextChip :text="item.userID"></ShortenTextChip>
      </template>
      <template v-slot:item.deviceID="{ item }">
        <ShortenTextChip :text="item.deviceID"></ShortenTextChip>
      </template>
      <template v-slot:item.publicKey="{ item }">
        <ShortenTextChip :text="item.publicKey"></ShortenTextChip>
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
