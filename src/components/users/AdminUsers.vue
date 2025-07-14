<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { User } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'
import NamespaceChips from './NamespaceChips.vue'

const headers = ref([
  { title: 'ID', key: 'id', value: (item: any) => shortUserID(item.userID) },
  { title: 'Name', key: 'displayName' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Login', key: 'login' },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const addUserDialog = ref(false)
const alert = ref<Alert>({ on: false })
const itemsPerPage = ref(10)
const loading = ref(false)
const loadUserOptions = ref()
const note = ref('')
const resetPasswordDialog = ref(false)
const search = ref('')
const serverItems = ref<User[]>()
const totalItems = ref(0)
const user = ref<User>()

const store = useUserStore()
const { namespace } = storeToRefs(store)

function shortUserID(id: string | undefined): string | undefined {
  return `${id?.substring(0, 13)}...`
}

function name(item: User): string {
  if (item.logins.length > 0) {
    return `${item.logins[0]?.login}(${item.displayName})`
  }
  return item.displayName
}

async function deleteUser(item: User) {
  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.deleteUsers(item.namespace, [item.userID])
    await loadUsers(loadUserOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted user ${name(item)}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting user.')
  loading.value = false
}

async function loadUsers(options: any) {
  loadUserOptions.value = options
  loading.value = true
  const ret = await tryRequest(async () => {
    // Parameters:
    // requestBody: string[],
    // filterBy?: string | undefined, filterValue?: string | undefined,
    // sortBy?: string | undefined, sortDesc?: string | undefined,
    // page?: number | undefined, pageSize?: number | undefined,
    // withDetails?: boolean | undefined,
    const ret = await userAPI.getUserList(
      [] /* id list */,
      undefined /* filterBy */,
      undefined /* filterValue */,
      options.sortBy[0]?.key /* sortBy */,
      options.sortBy[0]?.order /* sortDesc */,
      options.page,
      options.itemsPerPage,
      false /* withDetails */,
      true /* fromKeycloak */
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.users ?? []
    console.log('users:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading users.')
  loading.value = false
}

function confirmDeleteText(item: User): string {
  return `Delete user "${item.displayName}" with ID "${shortUserID(
    item.userID
  )}"?`
}

function addUserButtonClicked() {
  addUserDialog.value = true
}

function getUserNamespaces(user: User): string[] {
  if (user.adminNamespaces) {
    return user.adminNamespaces
  }
  return [namespace.value ?? '']
}
function resetUserPassword(item: User) {
  user.value = item
  resetPasswordDialog.value = true
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-1 my-2" align="center">
      <v-chip size="large">Admin users</v-chip>
      <v-spacer></v-spacer>
      <v-btn class="mx-2" @click="addUserButtonClicked">Add user</v-btn>
      <RefreshButton @refresh="loadUsers(loadUserOptions)" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadUsers"
    >
      <template v-slot:item.namespace="{ item }">
        <NamespaceChips :namespaces="getUserNamespaces(item)"></NamespaceChips>
      </template>
      <template v-slot:item.login="{ item }">
        <LoginChips :logins="item.logins"> </LoginChips>
      </template>
      <template v-slot:item.actions="{ item }">
        <ResetPasswordButton
          @click="resetUserPassword(item)"
        ></ResetPasswordButton>
        <DeleteButton
          v-model:note="note"
          :confirmDeleteText="confirmDeleteText(item)"
          @delete="deleteUser(item)"
        >
        </DeleteButton>
      </template>
    </v-data-table-server>
    <AddUserDialog
      v-model="addUserDialog"
      withNamespace
      withUsername
      mustSelectRoles
      @added="loadUsers(loadUserOptions)"
    ></AddUserDialog>
    <ResetPasswordDialog v-model="resetPasswordDialog" :user="user">
    </ResetPasswordDialog>
  </v-container>
</template>
