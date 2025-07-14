<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { WgNode } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, wgAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { compactList } from '@/plugins/utils'
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
    Key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen),
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<WgNode[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isAdmin } = storeToRefs(store)

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
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Deleted wireguard node ${name(item)}/${item.namespace}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting wg node.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  if (!isAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for administrators.',
    }
    return
  }

  const ret = await tryRequest(async () => {
    const ret = await wgAPI.listWgNodes([], options.page, options.itemsPerPage)
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.items ?? []
    console.log('wg nodes:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading wg nodes.')
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
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-chip size="large">WireGuard gateways</v-chip>
    <v-row align="center" justify="end">
      <RefreshButton @refresh="loadItems(loadOptions)" />
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
        <ShortenTextChip :text="item.publicKey"></ShortenTextChip>
      </template>

      <template v-slot:item.online="{ item }">
        <v-chip :color="item.online ? 'green' : 'grey'">
          {{ item.online ? 'Online' : 'Offline' }}
        </v-chip>
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
