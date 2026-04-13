<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { FwConfig } from '@/clients/supervisor/api'
import { supFwAPI } from '@/plugins/api'
import { useServerTable } from '@/composables/useServerTable'
import { useUserStore } from '@/stores/user'

const addFwDialog = ref(false)
const note = ref('')
const search = ref('')

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

const {
  alert,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<FwConfig>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options }) => {
    if (!isSysAdmin.value) {
      throw new Error('Operation is only allowed for system administrators.')
    }
    const ret = await supFwAPI().getFwList(
      undefined,
      options.page,
      options.itemsPerPage
    )
    return {
      items: ret?.data.fws ?? [],
      total: ret?.data.count ?? 0,
    }
  },
})

async function deleteItem(item: FwConfig) {
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

function confirmDeleteText(item: FwConfig): string {
  return `Delete fw "${item.name}" with ID "${item.id}"?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row align="center" fluid>
      <v-chip size="large">Firewalls</v-chip>
      <v-spacer></v-spacer>
      <AddButton label="Add firewall" @click="addFwDialog = true"></AddButton>
      <RefreshButton @refresh="refresh" />
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
    <AddFirewallDialog
      v-model="addFwDialog"
      @added="refresh"
    ></AddFirewallDialog>
  </v-container>
</template>
