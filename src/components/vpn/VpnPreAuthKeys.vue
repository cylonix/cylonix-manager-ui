<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { mdiCheck } from '@mdi/js'
import { storeToRefs } from 'pinia'
import { V1PreAuthKey } from '@/clients/headscale/api'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useServerTable } from '@/composables/useServerTable'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  forUserOnly?: boolean
}>()
const headers = ref([
  { title: 'Key', key: 'key', align: 'center' },
  { title: 'Description', key: 'description' },
  { title: 'Reusable', key: 'reusable' },
  { title: 'Ephemeral', key: 'ephemeral' },
  { title: 'Used', key: 'used' },
  { title: 'ACL tags', key: 'aclTags' },
  {
    title: 'Expiration',
    key: 'expiration',
  },
  {
    title: 'Created',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt),
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
] as const)

const adminHeaders = ref([
  {
    title: 'User',
    key: 'user',
    value: (item: any) => item.userDetail.loginName,
  },
  {
    title: 'ID',
    key: 'id',
  },
  ...headers.value,
] as const)

const sysAdminHeaders = ref([
  { title: 'Namespace', key: 'namespace' },
  ...adminHeaders.value,
] as const)

const note = ref('')
const search = ref('')

// Filter state
const filterEnterpriseID = ref()
const filterUser = ref()

// Expiry management
const expiryMenuKey = ref<V1PreAuthKey | null>(null)
const showDisableExpiryDialog = ref(false)
const showExpireNowDialog = ref(false)
const showSetExpiryDialog = ref(false)
const newExpiryDate = ref<Date | null>(null)
const expiryLoading = ref(false)

const store = useUserStore()
const { isAdmin, isNetworkAdmin, isSysAdmin, namespace, user } = storeToRefs(
  store
)

const {
  alert,
  hideFooter,
  itemsPerPage,
  loading,
  loadItems,
  refresh,
  serverItems,
  totalItems,
} = useServerTable<V1PreAuthKey>({
  defaultItemsPerPage: 20,
  onLoad: async ({ options, sortBy, sortDesc }) => {
    const uID = user.value?.userID
    if (!uID) {
      throw new Error('Missing user ID.')
    }

    let forNamespace = namespace.value
    if (isSysAdmin.value) {
      forNamespace = filterEnterpriseID.value
    }

    const ret = await vpnAPI.headscaleServiceListPreAuthKeys(
      isAdmin.value && !props.forUserOnly ? undefined : uID,
      [],
      isSysAdmin.value && !props.forUserOnly ? forNamespace : namespace.value,
      filterUser.value ? 'username' : undefined,
      filterUser.value,
      sortBy,
      sortDesc,
      options.page,
      options.itemsPerPage
    )
    return {
      items: ret?.data.preAuthKeys ?? [],
      total: ret?.data.total ?? 0,
    }
  },
})

const computedHeaders = computed(() => {
  if (props.forUserOnly) {
    return headers.value
  } else if (isSysAdmin.value) {
    return sysAdminHeaders.value
  } else if (isAdmin.value) {
    return adminHeaders.value
  }
  return headers.value
})

async function deleteItem(item: V1PreAuthKey) {
  loading.value = true
  const ret = await tryRequest(async () => {
    if (!item.id) {
      return
    }
    await vpnAPI.headscaleServiceDeletePreAuthKey(item.id)
    await refresh()
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted api key ${item.id} for ${item.user}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmDeleteText(item: V1PreAuthKey): string {
  return `Delete api key with ID "${item.id}" for "${item.user}"?`
}

function applyFilters() {
  refresh()
}

function clearFilters() {
  filterEnterpriseID.value = undefined
  filterUser.value = undefined
  refresh()
}

// Expiry management functions
function openExpiryMenu(item: V1PreAuthKey, option: 'disable' | 'set' | 'now') {
  expiryMenuKey.value = item
  if (option === 'disable') {
    showDisableExpiryDialog.value = true
  } else if (option === 'set') {
    // Set default to 6 months from now
    const sixMonthsLater = new Date()
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6)
    newExpiryDate.value = sixMonthsLater
    showSetExpiryDialog.value = true
  } else if (option === 'now') {
    showExpireNowDialog.value = true
  }
}

async function confirmDisableExpiry() {
  if (!expiryMenuKey.value?.key) return

  expiryLoading.value = true
  const ret = await tryRequest(async () => {
    await vpnAPI.headscaleServiceExpirePreAuthKey({
      id: expiryMenuKey.value!.id,
      expiry: '0001-01-01T00:00:00Z', // Zero timestamp to disable expiry
    })
    newToast({
      on: true,
      color: 'green',
      text: `Successfully disabled expiry for pre-auth key`,
    })
    showDisableExpiryDialog.value = false
    await refresh()
  })
  if (ret) {
    alert.value = ret
  }
  expiryLoading.value = false
}

async function confirmExpireNow() {
  if (!expiryMenuKey.value?.key) return

  expiryLoading.value = true
  const ret = await tryRequest(async () => {
    // Set expiry to current time to expire immediately
    await vpnAPI.headscaleServiceExpirePreAuthKey({
      id: expiryMenuKey.value!.id,
      expiry: new Date().toISOString(),
    })
    newToast({
      on: true,
      color: 'green',
      text: `Successfully expired pre-auth key`,
    })
    showExpireNowDialog.value = false
    await refresh()
  })
  if (ret) {
    alert.value = ret
  }
  expiryLoading.value = false
}

async function confirmSetExpiry() {
  if (!expiryMenuKey.value?.key || !newExpiryDate.value) return

  // Validate the date is not more than 6 months in the future
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 6)

  if (newExpiryDate.value > maxDate) {
    alert.value = {
      on: true,
      type: 'error',
      title: 'Invalid date',
      text: 'Expiry date cannot be more than 6 months in the future',
    }
    return
  }

  // Validate the date is in the future
  if (newExpiryDate.value <= new Date()) {
    alert.value = {
      on: true,
      type: 'error',
      title: 'Invalid date',
      text: 'Expiry date must be in the future',
    }
    return
  }

  expiryLoading.value = true
  const ret = await tryRequest(async () => {
    await vpnAPI.headscaleServiceExpirePreAuthKey({
      id: expiryMenuKey.value!.id,
      expiry: newExpiryDate.value!.toISOString(),
    })
    newToast({
      on: true,
      color: 'green',
      text: `Successfully set expiry for pre-auth key to ${newExpiryDate.value!.toLocaleDateString()}`,
    })
    showSetExpiryDialog.value = false
    await refresh()
  })
  if (ret) {
    alert.value = ret
  }
  expiryLoading.value = false
}

defineExpose({
  refresh,
})
</script>
<template>
  <v-container>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-chip class="mx-2" size="large">Pre-auth Keys</v-chip>
      <RefreshButton @refresh="refresh" />
    </v-row>

    <!-- Filter Row -->
    <v-row class="mx-2 mt-4 mb-2" align="start" justify="space-between">
      <v-col cols="12" md="3" v-if="isSysAdmin">
        <v-text-field
          v-model="filterEnterpriseID"
          label="Filter by Enterprise ID"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3" v-if="isAdmin || isNetworkAdmin">
        <v-text-field
          v-model="filterUser"
          label="Filter by User"
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
      class="mt-2"
      :headers="computedHeaders"
      :hide-default-footer="hideFooter"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:loading>
        <TableSkeleton :columns="computedHeaders.length" :rows="6" />
      </template>
      <template v-slot:item.key="{ item }">
        <ShortenTextChip :text="item.key ?? ''"></ShortenTextChip>
      </template>
      <template v-slot:item.ephemeral="{ item }">
        <v-icon v-if="item.ephemeral" color="purple" :icon="mdiCheck" />
      </template>
      <template v-slot:item.reusable="{ item }">
        <v-icon v-if="item.reusable" color="purple" :icon="mdiCheck" />
      </template>
      <template v-slot:item.used="{ item }">
        <v-icon v-if="item.used" color="purple" :icon="mdiCheck" />
      </template>
      <template v-slot:item.aclTags="{ item }">
        <span v-if="item.aclTags && item.aclTags.length > 0">{{
          item.aclTags
        }}</span>
      </template>

      <template v-slot:item.expiration="{ item }">
        <VpnExpiryMenu
          :expiry="item.expiration"
          @set="openExpiryMenu(item, 'set')"
          @disable="openExpiryMenu(item, 'disable')"
          @now="openExpiryMenu(item, 'now')"
        />
      </template>
      <template v-slot:item.actions="{ item }">
        <DeleteButton
          v-model:note="note"
          :confirmDeleteText="confirmDeleteText(item)"
          @delete="deleteItem(item)"
        >
        </DeleteButton>
      </template>
    </v-data-table-server>

    <!-- Disable Expiry Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDisableExpiryDialog"
      title="Disable Expiry"
      :loading="expiryLoading"
      @ok="confirmDisableExpiry"
    >
      <template v-slot:item>
        <p>Are you sure you want to disable expiry for this pre-auth key?</p>
        <p class="text-caption text-grey mt-2">
          This will set the key to never expire.
        </p>
      </template>
    </ConfirmDialog>

    <!-- Expire Now Confirmation Dialog -->
    <ConfirmDialog
      v-model="showExpireNowDialog"
      title="Expire Pre-Auth Key Now"
      :loading="expiryLoading"
      @ok="confirmExpireNow"
    >
      <template v-slot:item>
        <p>Are you sure you want to expire this pre-auth key immediately?</p>
        <p class="text-caption text-error mt-2">
          This will cause the key to become invalid and unusable.
        </p>
      </template>
    </ConfirmDialog>

    <!-- Set Expiry Time Dialog -->
    <ConfirmDialog
      v-model="showSetExpiryDialog"
      title="Set Expiry Time"
      :loading="expiryLoading"
      @ok="confirmSetExpiry"
    >
      <template v-slot:item>
        <p class="text-center mb-4">
          Set a new expiry time for this pre-auth key
        </p>
        <v-date-picker
          class="mx-auto"
          v-model="newExpiryDate"
          :min="new Date().toISOString().split('T')[0]"
          :max="
            new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
          "
          color="primary"
          show-adjacent-months
        ></v-date-picker>
        <p class="text-caption text-grey mt-2 text-center">
          Maximum expiry time is 6 months from now.
        </p>
      </template>
    </ConfirmDialog>
  </v-container>
</template>
