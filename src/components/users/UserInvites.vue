<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { User, UserInvite } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { shortUUID } from '@/plugins/utils'

import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { useNodesStore } from '@/stores/nodes'
const { isAdmin, isSysAdmin, isNetworkAdmin } = storeToRefs(useUserStore())
const nodesStore = useNodesStore()
const { smAndUp } = useDisplay()

onMounted(async () => {
  if (!isAdmin.value) {
    await loadAllUsers()
  }
})

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

const getHeaders = computed(() => {
  var h = <
    {
      title: string
      key: string
      value?: ((item: any) => string | undefined) | string
      align?: 'center' | 'start' | 'end' | undefined
      sortable?: boolean
    }[]
  >[
    {
      title: 'To',
      key: 'emails',
      value: (item: any) => showEmails(item.emails),
    },
    { title: 'For', key: 'for' },
  ]
  if (!smAndUp.value) {
    return [
      ...h,
      {
        title: 'Actions',
        key: 'actions',
        align: 'center' as const,
        sortable: false,
      },
    ]
  }
  h = [
    ...h,
    {
      title: 'Invited at',
      key: 'createdAt',
      value: (item: any) => shortTs(item.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center' as const,
      sortable: false,
    },
  ]

  if (isAdmin.value) {
    h = [
      { title: 'ID', key: 'id', value: (item: any) => shortUUID(item.id) },
      { title: 'Network', key: 'networkDomain' },
      ...h,
    ]
  }
  if (isSysAdmin.value) {
    h = [
      { title: 'ID', key: 'id', value: (item: any) => shortUUID(item.id) },
      { title: 'Enterprise ID', key: 'namespace' },
      { title: 'Network', key: 'networkDomain' },
      { title: 'From', key: 'invitedBy.displayName' },
      ...h,
    ]
  } else if (isAdmin.value) {
    ;[
      { title: 'ID', key: 'id', value: (item: any) => shortUUID(item.id) },
      { title: 'Network', key: 'networkDomain' },
      { title: 'From', key: 'invitedBy.displayName' },
      ...h,
    ]
  } else if (allUsers.value.length > 1) {
    h = [{ title: 'From', key: 'invitedBy.displayName' }, ...h]
  }
  return h
})

const allUsers = ref<User[]>([])
async function loadAllUsers(forceRefresh = false) {
  if (isSysAdmin.value || (!isAdmin.value && !isNetworkAdmin.value)) {
    // Don't load users if not a (network) admin or sysadmin
    return
  }

  // Check if we already have valid cached data
  if (nodesStore.isAllUsersValid() && !forceRefresh) {
    console.log('Using cached allUsers data')
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await userAPI.getUserList([])
    nodesStore.setAllUsers(ret?.data.users ?? [])
    console.log('users:', allUsers.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading all users.')
  loading.value = false
}

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
  return (
    `Delete invite with ID "${item.id}" for "${item.emails}"?` +
    `${
      item.shareNode
        ? ` Node "${item.shareNodeName}" shared with this invite will also be invoked.`
        : ''
    }` +
    ' This action cannot be undone.'
  )
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
    :headers="getHeaders"
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
    <template v-slot:item.for="{ item }">
      {{ item.shareNodeName ? 'sharing ' : 'as ' }}
      <span class="font-weight-bold text-blue-darken-2">
        {{ item.shareNodeName ? item.shareNodeName : item.role }}</span
      >
    </template>
  </v-data-table-server>
</template>

<style scoped>
.invite-container {
  background-color: rgb(var(--v-theme-surface));
}
</style>
