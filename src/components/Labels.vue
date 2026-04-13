<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { Label } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { labelAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useServerTable } from '@/composables/useServerTable'
import { useUserStore } from '@/stores/user'
import { mdiStar } from '@mdi/js'

const headers = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Label ID', key: 'id', align: 'center' },
  { title: 'Scope', key: 'scope', align: 'center' },
  { title: 'Name', key: 'name' },
  { title: 'Color', key: 'color' },
  { title: 'Category', key: 'category' },
  { title: 'Star', key: 'star', align: 'center' },
  { title: 'Description', key: 'description', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const addDialog = ref(false)
const note = ref('')
const search = ref('')

const store = useUserStore()
const { isAdmin, user } = storeToRefs(store)

const {
  alert,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<Label>({
  defaultItemsPerPage: 10,
  onLoad: async ({ options, sortBy, sortDesc }) => {
    const ret = await labelAPI.listLabel(
      undefined,
      undefined /* Label name */,
      undefined /* category */,
      undefined /* filter by */,
      undefined /* filter value */,
      sortBy,
      sortDesc,
      options.page,
      options.itemsPerPage
    )
    return {
      items: ret?.data.items ?? [],
      total: ret?.data.total ?? 0,
    }
  },
})

function shortID(id: string | undefined): string | undefined {
  return id?.substring(0)
}

function name(item: Label): string {
  return item.name
}

function canDelete(item: Label): boolean {
  return isAdmin.value ||
    (user.value?.userID && item.scope == user.value?.userID)
    ? true
    : false
}

async function deleteItem(item: Label) {
  if (!canDelete(item)) {
    alert.value = <Alert>{
      on: true,
      text: `
Only administrator can delete or create a public label.
Please login as an administrator first.
`,
    }
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    await labelAPI.deleteLabels([item.id])
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted label ${name(item)}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmDeleteText(item: Label): string {
  return `Delete label "${item.name}" with ID "${shortID(item.id)}"?`
}

function addButtonClicked() {
  addDialog.value = true
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-2 my-4" align="center">
      <v-chip size="large">Labels</v-chip>
      <v-spacer></v-spacer>
      <v-btn class="mx-1" @click="addButtonClicked">Add Label</v-btn>
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
      <template v-slot:item.id="{ item }">
        <ShortenTextChip :text="item.id"></ShortenTextChip>
      </template>
      <template v-slot:item.scope="{ item }">
        <ShortenTextChip v-if="item.scope" :text="item.scope"></ShortenTextChip>
      </template>
      <template v-slot:item.description="{ item }">
        <ShortenTextChip
          v-if="item.description"
          :text="item.description ?? ''"
        ></ShortenTextChip>
      </template>
      <template v-slot:item.color="{ item }">
        <v-avatar :color="item.color"></v-avatar>
      </template>
      <template v-slot:item.star="{ item }">
        <v-icon v-if="item.star" color="green" :icon="mdiStar"></v-icon>
      </template>
      <template v-slot:item.actions="{ item }">
        <DeleteButton
          v-if="canDelete(item)"
          v-model:note="note"
          :confirmDeleteText="confirmDeleteText(item)"
          @delete="deleteItem(item)"
        >
        </DeleteButton>
      </template>
    </v-data-table-server>
    <AddLabelDialog
      v-model="addDialog"
      withNamespace
      withUsername
      @added="refresh"
    >
    </AddLabelDialog>
  </v-container>
</template>
