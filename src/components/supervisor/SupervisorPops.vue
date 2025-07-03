<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { PopConfigOutput as PopConfig } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, supPopAPI } from '@/plugins/api'
//import { shortTs } from '@/plugins/date'
//import { newToast } from '@/plugins/toast'
//import { compactList } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'

/*const headers = ref([
    { title: 'ID', key: 'id', align: 'center' },
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
        title: 'Endpoints',
        key: 'endpoints',
        value: (item: any) => compactList(item.endpoints)
    },
    { title: 'Online', key: 'online', align: 'center' },
    {
        title: 'Last seen',
        Key: 'lastSeen',
        value: (item: any) => shortTs(item.lastSeen)
    },
    { title: 'Actions', key: 'actions', sortable: false }
] as const)*/

const addPopDialog=ref(false)
const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<PopConfig[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

async function deleteItem(item: PopConfig) {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.'
    }
    return
  }
  loading.value = true
  /*const ret = await tryRequest(async () => {
        await supPopAPI().deletePop(item.id ?? '')
        await loadItems(loadOptions.value)
        newToast({
            on: true,
            color: 'green',
            text: `Deleted wireguard instance ${item.name}`
        })
    })
    if (ret) {
        alert.value = ret
    }
    console.log('Done deleting wg instance.')*/
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.'
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supPopAPI().getPopList(
      undefined,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.count ?? 0
    serverItems.value = ret?.data.popList ?? []
    console.log('pop configs:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading pop configs.')
  loading.value = false
}

function confirmDeleteText(item: PopConfig): string {
  return `Delete pop "${item.name}" with ID "${item.id}"?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row align="center" fluid>
      <v-chip size="large">Pops</v-chip>
      <v-spacer></v-spacer>
      <AddButton label="Add Pop" @click="addPopDialog=true"></AddButton>
      <RefreshButton @refresh="loadItems(loadOptions)" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:item.id="{ item }">
        <ShortenTextChip :text="item.id"></ShortenTextChip>
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
    <AddSupervisorPopDialog
      v-model="addPopDialog"
      @added="loadItems(loadOptions)"
    ></AddSupervisorPopDialog>
  </v-container>
</template>
