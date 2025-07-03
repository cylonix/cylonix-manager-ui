<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { PredefinedRoles, User } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  {
    title: 'User ID',
    key: 'id',
    align: 'center',
  },
  { title: 'Name', key: 'displayName' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Login', key: 'login' },
  { title: 'Network Domain', key: 'networkDomain' },
  { title: 'Roles', key: 'roles' },
  { title: 'Mesh VPN mode', key: 'networkSetting.meshVpnMode' },
  { title: 'Auto approve device', key: 'auto-approve-device', align: 'center' },
  { title: 'Auto accept routes', key: 'auto-accept-routes', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const addUserDialog = ref(false)
const alert = ref<Alert>({ on: false })
const current = ref<User>()
const itemsPerPage = ref(10)
const loading = ref(false)
const loadUserOptions = ref()
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

async function deleteUser(item: User) {
  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.deleteUsers(item.namespace, [item.userID])
    newToast({
      on: true,
      color: 'green',
      text: `User ${item.displayName}(${shortUserID(item.userID)}) deleted`,
    })
    await loadUsers(loadUserOptions.value)
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
    await loadUsers(loadUserOptions.value)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done adding/deleting user role.')
  loading.value = false
}
</script>
<template>
  <v-container v-if="isAdmin" fluid>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-1 my-2" align="center" justify="space-between">
      <v-chip size="large">Users</v-chip>
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
      <template v-slot:item.auto-approve-device="{ item }">
        <v-icon v-if="item.autoApproveDevice" color="purple">mdi-check</v-icon>
      </template>
      <template v-slot:item.auto-accept-routes="{ item }">
        <v-icon v-if="item.autoAcceptRoutes" color="red">mdi-check</v-icon>
      </template>
      <template v-slot:item.actions="{ item }">
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
      </template>
    </v-data-table-server>
    <AddUserDialog
      v-model="addUserDialog"
      withUsername
      :withNamespace="isSysAdmin"
      @added="loadUsers(loadUserOptions)"
    ></AddUserDialog>
    <UpdateUserDialog
      v-model="updateUserDialog"
      :user="current"
      @updated="loadUsers(loadUserOptions)"
    ></UpdateUserDialog>
    <UpdateUserNetworkDomainDialog
      v-model="updateUserNetworkDomainDialog"
      :user="current"
      @updated="loadUsers(loadUserOptions)"
    ></UpdateUserNetworkDomainDialog>
    <ResetPasswordDialog v-model="resetPasswordDialog" :user="user">
    </ResetPasswordDialog>
  </v-container>
</template>
