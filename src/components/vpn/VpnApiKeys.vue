<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { V1ApiKey } from '@/clients/headscale/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
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

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<V1ApiKey[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isAdmin, isSysAdmin, namespace, user } = storeToRefs(store)

async function deleteItem(item: V1ApiKey) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.prefix) {
      return
    }
    await vpnAPI.headscaleServiceDeleteApiKey(item.prefix)
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted api key ${item.id} ${item.prefix}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting api key.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  let uID = user.value?.userID
  if (!uID) {
    alert.value = {
      on: true,
      text: 'Missing user ID.',
    }
    return
  }
  if (isAdmin.value) {
    uID = undefined
  }

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceListApiKeys(
      isAdmin.value ? undefined : uID,
      [],
      isSysAdmin.value ? undefined : namespace.value,
      undefined /* network */,
      undefined /* filterBy */,
      undefined /* filterValue */,
      options.sortBy[0]?.key /* sortBy */,
      options.sortBy[0]?.order == 'desc' ? true : false,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.apiKeys ?? []
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading items.')
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
