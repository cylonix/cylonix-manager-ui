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
import { useUserStore } from '@/stores/user'

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
const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<Label[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isAdmin, user } = storeToRefs(store)

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
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted label ${name(item)}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting Label.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await labelAPI.listLabel(
      undefined,
      undefined /* Label name */,
      undefined /* category */,
      undefined /* filter by */,
      undefined /* filter value */,
      options.sortBy[0]?.key /* sortBy */,
      options.sortBy[0]?.order /* sortDesc */,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.items ?? []
    console.log('labels:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading labels.')
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
        <v-icon v-if="item.star" color="green" icon="mdi-star"></v-icon>
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
      @added="loadItems(loadOptions)"
    >
    </AddLabelDialog>
  </v-container>
</template>
