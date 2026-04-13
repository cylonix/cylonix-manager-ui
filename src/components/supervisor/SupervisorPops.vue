<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { PopConfigOutput as PopConfig } from '@/clients/supervisor/api'
import { supPopAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { useServerTable } from '@/composables/useServerTable'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'ID', key: 'id', align: 'center' },
  { title: 'Name', key: 'name' },
  { title: 'City', key: 'city' },
  {
    title: 'Endpoint',
    key: 'grpcEndpoint',
  },
  {
    title: 'Default gateway',
    key: 'defaultGw',
  },
  {
    title: 'Underlay',
    key: 'underlayAddr',
  },
  {
    title: 'Updated at',
    key: 'updateTime',
    value: (item: any) => shortTs(item.updateTime),
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const addPopDialog = ref(false)
const note = ref('')
const search = ref('')

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

const {
  alert,
  hideFooter,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<PopConfig>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options }) => {
    if (!isSysAdmin.value) {
      throw new Error('Operation is only allowed for system administrators.')
    }
    const ret = await supPopAPI().getPopList(
      undefined,
      options.page,
      options.itemsPerPage
    )
    return {
      items: ret?.data.popList ?? [],
      total: ret?.data.count ?? 0,
    }
  },
})

async function deleteItem(item: PopConfig) {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }
  // TODO: implement delete
  loading.value = true
  loading.value = false
}

function confirmDeleteText(item: PopConfig): string {
  return `Delete pop "${item.name}" with ID "${item.id}"?`
}
</script>
<template>
  <v-container class="mt-2">
    <Alert v-model="alert"></Alert>
    <v-row align="center" class="mx-2" fluid>
      <v-chip size="large">Pops</v-chip>
      <v-spacer></v-spacer>
      <AddButton label="Add Pop" @click="addPopDialog = true"></AddButton>
      <RefreshButton @refresh="refresh" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :hide-default-footer="hideFooter"
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
      @added="refresh"
    ></AddSupervisorPopDialog>
  </v-container>
</template>
