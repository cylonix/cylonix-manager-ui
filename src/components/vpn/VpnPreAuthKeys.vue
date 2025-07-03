<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { V1PreAuthKey } from '@/clients/headscale/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'
import ShortenTextChip from '../chips/ShortenTextChip.vue'

const headers = ref([
  { title: 'ID', key: 'id' },
  { title: 'Enterprise ID', key: 'namespace' },
  {
    title: 'User',
    key: 'user',
    value: (item: any) => item.userDetail.loginName
  },
  { title: 'Key', key: 'key', align: 'center' },
  { title: 'Reusable', key: 'reusable' },
  { title: 'Ephemeral', key: 'ephemeral' },
  { title: 'Used', key: 'used' },
  { title: 'ACL tags', key: 'aclTags' },
  {
    title: 'Expiration',
    key: 'expiration',
    value: (item: any) => shortTs(item.expiration)
  },
  {
    title: 'Created',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt)
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false }
] as const)

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<V1PreAuthKey[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isAdmin, namespace, isSysAdmin, user } = storeToRefs(store)

async function deleteItem(item: V1PreAuthKey) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await vpnAPI.headscaleServiceDeleteApiKey(item.id)
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted api key ${item.id} for ${item.user}`
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting pre auth key.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  let uID = user.value?.userID
  if (!uID) {
    alert.value = {
      on: true,
      text: 'Missing user ID.'
    }
    return
  }
  if (isAdmin.value) {
    uID = undefined
  }

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceListPreAuthKeys(
      isAdmin.value ? undefined : uID,
      [],
      isSysAdmin.value ? undefined : namespace.value,
      undefined,
      undefined,
      options.sortBy[0]?.key /* sortBy */,
      options.sortBy[0]?.order == 'desc' ? true : false,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.preAuthKeys ?? []
    console.log('pre-auth-keys:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading items.')
  loading.value = false
}

function confirmDeleteText(item: V1PreAuthKey): string {
  return `Delete api key with ID "${item.id}" for "${item.user}"?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-chip size="large">Pre-auth Keys</v-chip>
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
      <template v-slot:item.key="{ item }">
        <ShortenTextChip :text="item.key ?? ''"></ShortenTextChip>
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
