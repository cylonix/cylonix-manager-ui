<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { UserInvite } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { shortUUID } from '@/plugins/utils'

import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
const { isAdmin } = storeToRefs(useUserStore())

const { smAndUp } = useDisplay()
const xsHeaders = ref([
  { title: 'To', key: 'emails', value: (item: any) => showEmails(item.emails) },
  {
    title: 'Role',
    key: 'role',
    value: (item: any) => (item.role ? item.role : 'Member'),
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const headers = ref([
  { title: 'From', key: 'invitedBy.displayName' },
  { title: 'To', key: 'emails', value: (item: any) => showEmails(item.emails) },
  {
    title: 'Role',
    key: 'role',
    value: (item: any) => (item.role ? item.role : 'Member'),
  },
  {
    title: 'Invited at',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt),
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

function showEmails(emails: string[]): string {
  if (emails.length === 0) {
    return ''
  }
  if (emails.length === 1) {
    return emails[0] ?? ''
  }
  if (smAndUp.value) {
    return emails.join(', ')
  }
  return emails[0] + ` (+${emails.length - 1} more)`
}

const adminViewHeaders = ref([
  { title: 'ID', key: 'id', value: (item: any) => shortUUID(item.id) },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Network', key: 'networkDomain' },
  ...headers.value,
] as const)

const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<UserInvite[]>()
const totalItems = ref(0)

async function deleteItem(item: UserInvite) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await userAPI.deleteUserInvite([item.id])
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted user invite ${item.id} for ${item.emails}`,
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

  const ret = await tryRequest(async () => {
    const sortBy = options?.sortBy
    var sortKey = undefined
    var sortOrder = undefined
    if (sortBy && sortBy.length > 0) {
      sortKey = sortBy?.[0]?.key
      sortOrder = sortBy?.[0]?.order
    }
    const ret = await userAPI.getUserInviteList(
      undefined,
      undefined,
      undefined,
      sortKey,
      sortOrder,
      options?.page,
      options?.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.items ?? []
    console.log('invites:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading items.')
  loading.value = false
}

defineExpose({
  loadItems,
  loadOptions: computed(() => loadOptions.value),
})

function confirmDeleteText(item: UserInvite): string {
  return `Delete invite with ID "${item.id}" for "${item.emails}"?`
}
</script>
<template>
  <Alert v-model="alert"></Alert>
  <v-row class="mx-2 my-1" align="center" justify="space-between">
    <h3 class="text-h6 mb-2">Invites</h3>
    <RefreshButton @refresh="loadItems(loadOptions)" />
  </v-row>
  <v-data-table-server
    v-model:items-per-page="itemsPerPage"
    class="mt-2"
    :headers="isAdmin ? adminViewHeaders : smAndUp ? headers : xsHeaders"
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
</template>

<style scoped>
.invite-container {
  background-color: rgb(var(--v-theme-surface));
}
</style>
