<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { WgInstance } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, supWgAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { compactList } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'

const headers = ref([
    { title: 'ID', key: 'id' },
    { title: 'Name', key: 'name' },
    { title: 'Endpoint', key: 'conn' },
    {
        title: 'Access Points',
        key: 'accessPoints',
        value: (item: any) => compactList(item.accessPoints)
    },
    {
        title: 'Default Gateway',
        key: 'defaultGw',
    },
    {
        title: 'Default Interface',
        key: 'defaultInterface',
    },
    { title: 'Pop', key: 'pop' },
    { title: 'Actions', key: 'actions', sortable: false }
] as const)

const addWgDialog = ref(false)
const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<WgInstance[]>([])
const totalItems = ref(0)

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

async function deleteItem(item: WgInstance) {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    await supWgAPI().deleteWgInstance(item.id ?? '')
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Deleted wireguard instance ${item.name}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting wg instance.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supWgAPI().getWgInstanceList(
      undefined,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.count ?? 0
    serverItems.value = ret?.data.wgInstances ?? []
    console.log('wg gateways:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading wg gateways.')
  loading.value = false
}

function confirmDeleteText(item: WgInstance): string {
  return `Delete wireguard gateway "${item.name}" with ID "${item.id}"?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row align="center" class="mx-2 my-2">
      <v-chip size="large">WireGuard gateways</v-chip>
      <v-spacer></v-spacer>
      <AddButton @click="addWgDialog = true"></AddButton>
      <RefreshButton @refresh="loadItems(loadOptions)" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :hide-default-footer="totalItems <= itemsPerPage"
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
    <AddSupervisorWgDialog
      v-model="addWgDialog"
      @added="loadItems(loadOptions)"
    ></AddSupervisorWgDialog>
  </v-container>
</template>
