<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { V1User } from '@/clients/headscale/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const headers = ref([
  { title: 'Name', key: 'loginName' },
  {
    title: 'Created at',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt),
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const adminViewHeaders = ref([
  { title: 'ID', key: 'id' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Stable ID', key: 'name' },
  { title: 'User ID', key: 'userID' },
  ...headers.value,
] as const)

const alert = ref<Alert>({ on: false })
const inviteDialog = ref(false)
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<V1User[]>()
const totalItems = ref(0)
const welcomeDialog = ref(false)

const store = useUserStore()
const { isAdmin, isNetworkAdmin, isSysAdmin, namespace, user } = storeToRefs(
  store
)

const signInProvider = computed(() => {
  const logins = user.value?.logins ?? []
  if (logins.length === 0) {
    return undefined
  }
  return logins[0]?.provider
})

const publicDomains = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'privaterelay.appleid.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'live.com',
  'msn.com',
  'googlemail.com',
]

const organization = computed(() => {
  const email = user.value?.email
  if (!email) {
    return 'your organization'
  }

  const domain = email.split('@')[1]
  if (!domain || publicDomains.includes(domain.toLowerCase())) {
    return 'your organization'
  }

  // Return first part of domain (e.g., 'company' from 'company.com')
  return (
    (domain.split('.')[0]?.charAt(0).toUpperCase() ?? '') +
    (domain.split('.')[0]?.slice(1) ?? 'your organization')
  )
})

async function deleteItem(item: V1User) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await vpnAPI.headscaleServiceDeleteUser(item.name ?? '')
    await loadItems(loadOptions.value)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted user ${item.id} ${item.loginName}`,
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
  const uID = user.value?.userID
  const network = user.value?.networkDomain
  if (!uID) {
    alert.value = {
      on: true,
      text: 'Missing user ID.',
    }
    return
  }

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceListUsers(
      isAdmin.value || isNetworkAdmin ? undefined : uID,
      [],
      isSysAdmin.value ? undefined : namespace.value,
      isAdmin.value ? undefined : isNetworkAdmin ? network : undefined,
      undefined,
      undefined,
      options.sortBy[0]?.key /* sortBy */,
      options.sortBy[0]?.order == 'desc' ? true : false,
      options.page,
      options.itemsPerPage
    )
    serverItems.value = ret?.data.users ?? []
    console.log('users:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading items.')
  loading.value = false
}

function confirmDeleteText(item: V1User): string {
  return `Delete user with ID "${item.id} ${item.loginName}"?`
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row v-if="isNetworkAdmin" class="my-4">
      <v-col cols="5" xs="12">
        <v-sheet
          class="invite-container pa-4 h-100 d-flex flex-column"
          elevation="0"
          rounded="lg"
          border
        >
          <div>
            <h3 class="text-h6 mb-2">Add Users of {{ organization }}</h3>
            <p class="text-body-1">
              Add other users from {{ organization }} to your Cylonix
              network. They'll receive a welcome email with instructions to get
              started.
            </p>
          </div>
          <v-spacer></v-spacer>
          <v-row class="mt-2 mb-1 mx-1" justify="end" align="center"
            ><v-btn
              color="primary"
              prepend-icon="mdi-account-plus"
              @click="welcomeDialog = true"
            >
              Send Welcome Email
            </v-btn></v-row
          >
        </v-sheet>
      </v-col>
      <v-col cols="5" xs="12">
        <v-sheet
          class="invite-container pa-4 h-100 d-flex flex-column"
          elevation="0"
          rounded="lg"
          border
        >
          <div>
            <h3 class="text-h6 mb-2">Invite External Users</h3>
            <p class="text-body-1">
              Invite other users from external partners to join your Cylonix
              network. They'll receive an email invitation with instructions to
              get started.
            </p>
          </div>
          <v-spacer></v-spacer>
          <v-row class="mt-2 mb-1 mx-1" justify="end" align="center"
            ><v-btn
              color="primary"
              prepend-icon="mdi-account-plus"
              @click="inviteDialog = true"
            >
              Invite External User
            </v-btn></v-row
          >
        </v-sheet>
      </v-col>
      <v-col cols="2" xs="12">
        <v-sheet
          class="pa-4 h-100 d-flex flex-column"
          elevation="0"
          rounded="lg"
          border
        >
          <h3 class="text-h6 mb-2">Sign-in Provider</h3>
          <div class="d-flex mx-auto my-auto gap-2">
            <img
              v-if="signInProvider == 'google'"
              src="@/assets/google_light.svg"
              alt="Google Sign-in"
              width="32"
              height="32"
            />
            <v-icon
              v-if="signInProvider == 'apple'"
              icon="mdi-apple"
              size="32"
            />
            <v-icon
              v-if="signInProvider == 'github'"
              icon="mdi-github"
              size="32"
            />
            <p v-if="!signInProvider">Custom</p>
          </div>
        </v-sheet>
      </v-col>
    </v-row>
    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-chip size="large">Users</v-chip>
      <RefreshButton @refresh="loadItems(loadOptions)" />
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="isSysAdmin ? adminViewHeaders : headers"
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
  </v-container>
  <SendWelcomeEmailDialog
    v-model="welcomeDialog"
    :organization="organization"
    @send="loadItems(loadOptions)"
  ></SendWelcomeEmailDialog>
  <InviteExternalUserDialog
    v-model="inviteDialog"
    @send="loadItems(loadOptions)"
  ></InviteExternalUserDialog>
</template>

<style scoped>
.invite-container {
  background-color: rgb(var(--v-theme-surface));
}
</style>
