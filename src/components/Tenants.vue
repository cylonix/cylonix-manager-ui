<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { TenantConfig } from '@/clients/manager'
import type { Alert } from '@/plugins/alert'
import { tenantAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useTenantsStore } from '@/stores/tenants'
import { useUserStore } from '@/stores/user'

const { isSysAdmin } = storeToRefs(useUserStore())
const tenantsCache = useTenantsStore()

const headers = ref([
  {
    title: 'ID',
    align: 'center',
    key: 'id',
  },
  { title: 'Company Name', align: 'start', key: 'name' },
  { title: 'Enterprise ID', align: 'start', key: 'namespace' },
  { title: 'Email', align: 'start', key: 'email' },
  { title: 'Phone', align: 'start', key: 'phone' },
  { title: 'Auto approve device', align: 'center', key: 'auto-approve-device' },
  { title: 'Auto accept routes', align: 'center', key: 'auto-accept-routes' },
  { title: 'Welcome email sent', align: 'center', key: 'welcome-email-sent' },
  { title: 'Max Devices', key: 'maxDeviceCount', align: 'center' },
  { title: 'Max Users', key: 'maxUserCount', align: 'center' },
  { title: 'Max DevicesPerUser', key: 'maxDevicePerUser', align: 'center' },
  { title: 'Address', align: 'center', key: 'data-table-expand' },
  { title: 'Actions', align: 'center', key: 'actions', sortable: false },
] as const)

const addTenantDialog = ref()
const alert = ref<Alert>({ on: false })
const editTenantDialog = ref()
const itemsPerPage = ref(10)
const loading = ref(false)
const loadTenantOptions = ref()
const note = ref()
const search = ref('')
const serverItems = ref<TenantConfig[]>([])
const tenant = ref<TenantConfig>()
const totalItems = ref(0)

async function loadTenants(options: any) {
  loadTenantOptions.value = options
  loading.value = true
  const ret = await tryRequest(async () => {
    // Parameters:
    // requestBody: string[], namespace?: string | undefined,
    // contain?: string | undefined, filterBy?: string | undefined,
    // filterValue?: string | undefined, sortBy?: string | undefined,
    // sortDesc?: string | undefined, page?: number | undefined,
    // pageSize?: number | undefined
    const ret = await tenantAPI.listTenantConfig(
      [] /* id list */,
      undefined /* namespace */,
      undefined /* contain */,
      undefined /* filterBy */,
      undefined /* filterValue */,
      options.sortBy[0]?.key /* sortBy */,
      options.sortBy[0]?.order /* sortDesc */,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.items ?? []
    for (const t of serverItems.value) {
      tenantsCache.set(t)
    }
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
function confirmDeleteText(item: TenantConfig): string {
  return `Please confirm permanently deleting tenant "${item.name}".`
}
function editTenant(item: TenantConfig) {
  tenant.value = item
  editTenantDialog.value = true
}
async function deleteTenant(item: TenantConfig) {
  console.log(`Deleting tenant "${item.name}".`)
  loading.value = true
  const ret = await tryRequest(async () => {
    await tenantAPI.deleteTenantConfigs([item.id])
    newToast({
      on: true,
      color: 'green',
      text: `Tenant "${item.name}" has been deleted successfully.`,
    })
    await loadTenants(loadTenantOptions.value)
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>
<template>
  <v-container class="fill-height">
    <Alert v-model="alert"></Alert>
    <v-row class="my-2" align="center">
      <v-chip class="mx-2" size="large" variant="text">Tenants</v-chip>
      <v-spacer></v-spacer>
      <v-btn v-if="isSysAdmin" class="mx-2" @click="addTenantDialog = true"
        >Add tenant</v-btn
      >
      <RefreshButton class="mx-2" @refresh="loadTenants(loadTenantOptions)" />
    </v-row>
    <v-data-table-server
      class="mt-2"
      v-model:items-per-page="itemsPerPage"
      show-expand
      :headers="headers"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadTenants"
    >
      <template v-slot:item.id="{ item }">
        <ShortenTextChip :text="item.id" />
      </template>
      <template v-slot:item.welcome-email-sent="{ item }">
        <v-icon v-if="item.welcomeEmailSent" color="green">mdi-check</v-icon>
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
          @delete="deleteTenant(item)"
        >
        </DeleteButton>
        <EditButton @click="editTenant(item)"></EditButton>
      </template>
      <template v-slot:expanded-row="{ item }">
        <v-card-text :text="item.address"></v-card-text>
      </template>
    </v-data-table-server>
    <AddTenantDialog
      v-model="addTenantDialog"
      @added="loadTenants(loadTenantOptions)"
    >
    </AddTenantDialog>
    <UpdateTenantDialog
      v-model="editTenantDialog"
      :tenant="tenant"
      @updated="loadTenants(loadTenantOptions)"
    >
    </UpdateTenantDialog>
  </v-container>
</template>
