<script setup lang="ts">
import { ref } from 'vue'
import { WgDevice } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, wgAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { compactList } from '@/plugins/utils'

const headers = ref([
  { title: 'Device ID', key: 'deviceID', align: 'center' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Name', key: 'name' },
  { title: 'Public key', key: 'publicKey', align: 'center' },
  {
    title: 'Addresses',
    key: 'addresses',
    value: (item: any) => compactList(item.addresses)
  },
  {
    title: 'Allowed IPs',
    key: 'allowedIps',
    value: (item: any) => compactList(item.allowedIps)
  },
  {
    title: 'Last seen',
    Key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen)
  },
  { title: 'Actions', key: 'actions', sortable: false }
] as const)

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<WgDevice[]>()
const totalItems = ref(0)
const onlineCount = ref(0)

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
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Deleted wireguard device ${name(item)}/${item.namespace}`
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting wg device.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await wgAPI.listVpnDevice(
      [],
      undefined,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.devices ?? []
    onlineCount.value = ret?.data.online ?? 0
    console.log('wg devices:', ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading wg devices.')
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
