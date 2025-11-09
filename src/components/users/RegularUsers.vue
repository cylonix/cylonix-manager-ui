<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { decamelize } from '@cylonix/humps'
import { PredefinedRoles, User } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const sysAdminHeaders = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'User ID', key: 'id', align: 'center' },
  { title: 'Name', key: 'displayName' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Login', key: 'login' },
  { title: 'Network Domain', key: 'networkDomain' },
  { title: 'Roles', key: 'roles', align: 'center' },
  { title: 'Mesh VPN mode', key: 'networkSetting.meshVpnMode' },
  { title: 'Mesh VPN Enabled', key: 'wgEnabled', align: 'center' },
  { title: 'Gateway Enabled', key: 'gatewayEnabled', align: 'center' },
  { title: 'Auto approve device', key: 'auto-approve-device', align: 'center' },
  { title: 'Auto accept routes', key: 'auto-accept-routes', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const adminHeaders = ref([
  { title: 'User ID', key: 'id', align: 'center' },
  { title: 'Name', key: 'displayName' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Login', key: 'login' },
  { title: 'Network Domain', key: 'networkDomain' },
  { title: 'Roles', key: 'roles', align: 'center' },
  { title: 'Mesh VPN mode', key: 'networkSetting.meshVpnMode' },
  { title: 'Mesh VPN Enabled', key: 'wgEnabled', align: 'center' },
  { title: 'Gateway Enabled', key: 'gatewayEnabled', align: 'center' },
  { title: 'Auto approve device', key: 'auto-approve-device', align: 'center' },
  { title: 'Auto accept routes', key: 'auto-accept-routes', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const addUserDialog = ref(false)
const alert = ref<Alert>({ on: false })
const current = ref<User>()
const filterEnterpriseID = ref()
const filterUser = ref()
const filterOnlineOnly = ref()
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const resetPasswordDialog = ref(false)
const search = ref('')
const serverItems = ref<User[]>()
const totalItems = ref(0)
const updateUserDialog = ref(false)
const updateUserNetworkDomainDialog = ref(false)
const user = ref<User>()
const role = ref('')

const store = useUserStore()
const { isAdmin, isSysAdmin } = storeToRefs(store)

function shortUserID(id: string | undefined): string | undefined {
  return `${id?.substring(0, 13)}...`
}

const headers = computed(() => {
  if (isSysAdmin.value) {
    return sysAdminHeaders.value
  } else {
    return adminHeaders.value
  }
})

async function deleteUser(item: User) {
  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.deleteUsers(item.namespace, [item.userID])
    newToast({
      on: true,
      color: 'green',
      text: `User ${item.displayName}(${shortUserID(item.userID)}) deleted`,
    })
    await loadItems(loadOptions.value)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done deleting user.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  const ret = await tryRequest(async () => {
    let sortBy: string | undefined
    let sortDesc: string | undefined
    for (const [i, sort] of options.sortBy.entries()) {
      if (i === 0) {
        sortBy = decamelize(sort.key)
        sortDesc = sort.order ?? ''
      } else {
        sortBy = sortBy + ',' + decamelize(sort.key)
        sortDesc = sortDesc + ',' + (sort.order ?? '')
      }
    }

    let filterBy: string | undefined
    let filterValue: string | undefined

    const filterFields: string[] = []
    const filterValues: string[] = []

    if (filterEnterpriseID.value) {
      filterFields.push('namespace')
      filterValues.push(filterEnterpriseID.value)
    }
    if (filterFields.length > 1) {
      filterBy = filterFields.join(',')
      filterValue = filterValues.join(',')
    } else if (filterFields.length === 1) {
      filterBy = filterFields[0]
      filterValue = filterValues[0]
    }

    // Parameters:
    // requestBody: string[],
    // filterBy?: string | undefined, filterValue?: string | undefined,
    // sortBy?: string | undefined, sortDesc?: string | undefined,
    // page?: number | undefined, pageSize?: number | undefined,
    // withDetails?: boolean | undefined,
    const ret = await userAPI.getUserList(
      [] /* id list */,
      filterUser.value,
      filterOnlineOnly.value,
      filterBy,
      filterValue,
      sortBy,
      sortDesc,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.users
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
  )}" and login "${item.logins[0]?.login}"?`
}
function resetUserPassword(item: User) {
  user.value = item
  resetPasswordDialog.value = true
}
function addUserButtonClicked() {
  addUserDialog.value = true
}
function edit(item: User) {
  current.value = item
  updateUserDialog.value = true
}
function editNetworkDomain(item: User) {
  current.value = item
  updateUserNetworkDomainDialog.value = true
}
async function addDelRole(item: User, deleteRole: boolean, role: string) {
  const ret = await tryRequest(async () => {
    loading.value = true
    const v = role as PredefinedRoles
    await userAPI.updateUser(item.userID, item.namespace, {
      delRole: deleteRole ? v : undefined,
      addRole: deleteRole ? undefined : v,
    })
    newToast({
      on: true,
      color: 'green',
      text: `User ${item.displayName}(${shortUserID(item.userID)}) ${
        deleteRole ? 'deleted' : 'added'
      } role ${role}`,
    })
    await loadItems(loadOptions.value)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done adding/deleting user role.')
  loading.value = false
}
function applyFilters() {
  loadItems(loadOptions.value)
}
function clearFilters() {
  filterEnterpriseID.value = undefined
  filterUser.value = undefined
  filterOnlineOnly.value = undefined
  loadItems(loadOptions.value)
}
</script>
<template>
  <v-container class="ma-4" v-if="isAdmin" fluid>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-1 my-2" align="center" justify="space-between">
      <v-chip size="large">Users</v-chip>
      <v-spacer></v-spacer>
      <AddButton label="Add User" @click="addUserButtonClicked"></AddButton>
      <RefreshButton @refresh="loadItems(loadOptions)" />
    </v-row>

    <!-- Filter Row -->
    <v-row class="mx-1 mt-4 mb-2" align="start" justify="space-between">
      <v-col cols="12" md="3" v-if="isSysAdmin">
        <v-text-field
          v-model="filterEnterpriseID"
          label="Filter by Enterprise ID"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-text-field
          v-model="filterUser"
          label="Filter by User"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-switch
          v-model="filterOnlineOnly"
          color="green"
          label="Online Only"
          density="compact"
          @update:modelValue="loadItems(loadOptions)"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn color="primary" @click="applyFilters"> Filter </v-btn>
      </v-col>
      <v-col cols="12" md="2" align="end">
        <v-btn variant="outlined" @click="clearFilters"> Clear Filters </v-btn>
      </v-col>
    </v-row>

    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="ma-2"
      :headers="headers"
      :hide-default-footer="totalItems <= itemsPerPage"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:item.id="{ item }">
        <ShortenTextChip :text="item.userID" />
      </template>
      <template v-slot:item.login="{ item }">
        <LoginChips :logins="item.logins"></LoginChips>
      </template>
      <template v-slot:item.networkDomain="{ item }">
        <v-chip variant="text" :text="item.networkDomain ?? ''" />
        <EditButton
          v-if="!item.networkDomain"
          @click="editNetworkDomain(item)"
        ></EditButton>
      </template>
      <template v-slot:item.roles="{ item }">
        <RoleChips
          :user="item"
          v-model="role"
          @add="addDelRole(item, false, role)"
          @delete="addDelRole(item, true, role)"
        />
      </template>
      <template v-slot:item.wgEnabled="{ item }">
        <v-icon v-if="item.networkSetting?.wgEnabled" color="purple"
          >mdi-check</v-icon
        >
      </template>
      <template v-slot:item.gatewayEnabled="{ item }">
        <v-icon v-if="item.networkSetting?.gatewayEnabled" color="purple"
          >mdi-check</v-icon
        >
      </template>
      <template v-slot:item.auto-approve-device="{ item }">
        <v-icon v-if="item.autoApproveDevice" color="purple">mdi-check</v-icon>
      </template>
      <template v-slot:item.auto-accept-routes="{ item }">
        <v-icon v-if="item.autoAcceptRoutes" color="red">mdi-check</v-icon>
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="d-flex align-center">
          <DeleteButton
            v-model:note="note"
            :confirmDeleteText="confirmDeleteText(item)"
            @delete="deleteUser(item)"
          >
          </DeleteButton>
          <ResetPasswordButton
            @click="resetUserPassword(item)"
          ></ResetPasswordButton>
          <EditButton @click="edit(item)"></EditButton>
        </div>
      </template>
    </v-data-table-server>
    <AddUserDialog
      v-model="addUserDialog"
      withUsername
      :withNamespace="isSysAdmin"
      @added="loadItems(loadOptions)"
    ></AddUserDialog>
    <UpdateUserDialog
      v-model="updateUserDialog"
      :user="current"
      @updated="loadItems(loadOptions)"
    ></UpdateUserDialog>
    <UpdateUserNetworkDomainDialog
      v-model="updateUserNetworkDomainDialog"
      :user="current"
      @updated="loadItems(loadOptions)"
    ></UpdateUserNetworkDomainDialog>
    <ResetPasswordDialog v-model="resetPasswordDialog" :user="user">
    </ResetPasswordDialog>
  </v-container>
</template>
