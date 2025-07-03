<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { V1User } from '@/clients/headscale/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'Name', key: 'loginName' },
  {
    title: 'Created at',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt),
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const adminViewHeaders = ref([
  { title: 'ID', key: 'id' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Stable ID', key: 'name' },
  { title: 'User ID', key: 'userID' },
  ...headers.value,
] as const)

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<V1User[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isAdmin, isNetworkAdmin, isSysAdmin, namespace, user } = storeToRefs(
  store
)

async function deleteItem(item: V1User) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await vpnAPI.headscaleServiceDeleteUser(item.name ?? '')
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted user ${item.id} ${item.loginName}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  const uID = user.value?.userID
  const network = user.value?.networkDomain
  if (!uID) {
    alert.value = {
      on: true,
      text: 'Missing user ID.',
    }
    return
  }

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceListUsers(
      isAdmin.value || isNetworkAdmin ? undefined : uID,
      [],
      isSysAdmin.value ? undefined : namespace.value,
      isAdmin.value ? undefined : isNetworkAdmin ? network : undefined,
      undefined,
      undefined,
      options.sortBy[0]?.key /* sortBy */,
      options.sortBy[0]?.order == 'desc' ? true : false,
      options.page,
      options.itemsPerPage
    )
    serverItems.value = ret?.data.users ?? []
    console.log('users:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading items.')
  loading.value = false
}

function confirmDeleteText(item: V1User): string {
  return `Delete user with ID "${item.id} ${item.loginName}"?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-chip size="large">Users</v-chip>
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
