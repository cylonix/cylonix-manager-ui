<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { decamelize } from '@cylonix/humps'
import { OauthProvider } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, loginAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { shortTs } from '@/plugins/date'
import { useUserStore } from '@/stores/user'
const adminHeaders = ref([
  { title: 'ID', key: 'id', align: 'center' },
  { title: 'Domain', key: 'domain' },
  { title: 'Admin Account', key: 'adminEmail' },
  { title: 'Provider', key: 'provider' },
  { title: 'Client ID', key: 'clientID' },
  { title: 'Client Secret', key: 'clientSecret' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
  { title: 'Created At', key: 'createdAt', value: (item: any) => shortTs(item.createdAt) },
  { title: 'Updated At', key: 'updatedAt', value: (item: any) => shortTs(item.updatedAt) },
] as const)

const sysAdminHeaders = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  ...adminHeaders.value,
] as const)

const alert = ref<Alert>({ on: false })
const current = ref<OauthProvider>()
const filterEnterpriseID = ref()
const filterUser = ref()
const itemsPerPage = ref(10)
const loading = ref(false)
const loadOptions = ref()
const note = ref('')
const search = ref('')
const serverItems = ref<OauthProvider[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

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
    if (filterUser.value) {
      filterFields.push('admin_email')
      filterValues.push(filterUser.value)
    }
    if (filterFields.length > 1) {
      filterBy = filterFields.join(',')
      filterValue = filterValues.join(',')
    } else if (filterFields.length === 1) {
      filterBy = filterFields[0]
      filterValue = filterValues[0]
    }

    const ret = await loginAPI.listOauthProviders(
      filterBy,
      filterValue,
      sortBy,
      sortDesc,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.oauthProviders ?? []
    console.log('users:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading users.')
  loading.value = false
}

async function deleteProvider() {
  if (!current.value) {
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await loginAPI.deleteOauthProviders([current.value!.id!])
    if (ret?.data) {
      newToast({
        on: true,
        text: 'Provider deleted successfully.',
        color: 'success',
      })
      loadItems(loadOptions.value)
    }
  })
  loading.value = false
  if (ret) {
    alert.value = ret
  }
}

function confirmDeleteText(item: OauthProvider): string {
  return `Delete provider "${item.domain}" with ID "${shortUserID(
    item.id
  )}"?`
}
function applyFilters() {
  loadItems(loadOptions.value)
}
function clearFilters() {
  filterEnterpriseID.value = undefined
  filterUser.value = undefined
  loadItems(loadOptions.value)
}
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-1 my-2" align="center" justify="space-between">
      <v-chip size="large">Users</v-chip>
      <v-spacer></v-spacer>
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
          label="Filter by Admin Account"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn color="primary" @click="applyFilters"> Filter </v-btn>
      </v-col>
      <v-col cols="12" md="2" align="end">
        <v-btn class="mx-2" variant="outlined" @click="clearFilters">
          Clear Filters
        </v-btn>
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
        <ShortenTextChip :text="item.id" />
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="d-flex align-center">
          <DeleteButton
            v-model:note="note"
            :confirmDeleteText="confirmDeleteText(item)"
            @delete="current = item; deleteProvider()"
          >
          </DeleteButton>
        </div>
      </template>
    </v-data-table-server>
  </v-container>
</template>
