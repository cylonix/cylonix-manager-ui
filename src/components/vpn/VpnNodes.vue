<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { decamelize } from '@cylonix/humps'
import { V1Node } from '@/clients/headscale/api'
import { useCurrentNode } from '@/composables/useCurrentNode'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { formatExpiry, shortTs } from '@/plugins/date'
import { hexToBase64 } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const { setCurrentNode } = useCurrentNode()
const { smAndUp, mdAndUp, lgAndUp } = useDisplay()

function navigateToDetails(item: V1Node) {
  setCurrentNode(item)
  router.push('/ui/vpn-node-details')
}

function getNodeKeyBase64(nodeKey: string): string {
  // Remove "nodekey:" prefix
  const hexString = nodeKey.substring(8)
  return hexToBase64(hexString)
}

function getMachineKeyBase64(machineKey: string): string {
  // Remove "mkey:" prefix
  const hexString = machineKey.substring(5)
  return hexToBase64(hexString)
}

const adminViewHeaders = ref([
  { title: 'ID', key: 'id' },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Network Domain', key: 'networkDomain' },
  { title: 'User', key: 'user', value: (item: any) => item.user.loginName },
  { title: 'User ID', key: 'userID' },
  {
    title: 'Machine key',
    key: 'machineKey',
    value: (item: any) => {
      const base64Key = getMachineKeyBase64(item.machineKey)
      return `B[${base64Key.substring(0, 5)}] H[${item.machineKey.substring(
        5,
        10
      )}]`
    },
  },
  {
    title: 'Node key',
    key: 'nodeKey',
    value: (item: any) => {
      const base64Key = getNodeKeyBase64(item.nodeKey)
      return `B[${base64Key.substring(0, 5)}] H[${item.nodeKey.substring(
        8,
        13
      )}]`
    },
  },
  {
    title: 'IP',
    key: 'ipAddresses',
    value: (item: any) => {
      if ((item.ipAddresses.length = 1)) {
        return item.ipAddresses[0]
      }
      if (item.ipAddresses.length > 1) {
        return item.ipAddresses[0].join(',')
      }
    },
  },
  { title: 'Name', key: 'name' },
  { title: 'Given Name', key: 'givenName' },
  {
    title: 'Created at',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt),
  },
  {
    title: 'Last seen',
    key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen),
  },
  {
    title: 'Expiry',
    key: 'expiry',
    value: (item: any) => shortTs(item.expiry),
  },
  {
    title: 'Pre-auth key',
    key: 'preAuthKey',
    value: (item: any) => item.preAuthKey?.key.substring(0, 16),
  },
  {
    title: 'Register with',
    key: 'registerWith',
    value: (item: any) => item.registerMethod.substring(16),
  },
  { title: 'Forced tags', key: 'forcedTags' },
  { title: 'Invalid tags', key: 'invalidTags' },
  { title: 'Online', key: 'online' },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
  { title: 'View details', key: 'viewDetails', align: 'center' },
] as const)

const lgHeaders = ref([
  { title: 'Name', key: 'givenName' },
  { title: 'User', key: 'user', value: (item: any) => item.user.loginName },
  {
    title: 'IP',
    key: 'ipAddresses',
    value: (item: any) => {
      if ((item.ipAddresses.length = 1)) {
        return item.ipAddresses[0]
      }
      if (item.ipAddresses.length > 1) {
        return item.ipAddresses[0].join(',')
      }
    },
  },
  {
    title: 'Last seen',
    key: 'lastSeen',
    value: (item: any) => shortTs(item.lastSeen),
  },
  {
    title: 'OS Version',
    key: 'osVersion',
    value: (item: any) => item.hostinfo?.osVersion,
  },
  {
    title: 'IPN Version',
    key: 'ipnVersion',
    value: (item: any) => item.hostinfo?.ipnVersion,
  },
  { title: 'Online', key: 'online' },
  {
    title: 'Expiry',
    key: 'expiry',
    value: (item: any) => formatExpiry(item.expiry),
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
  { title: 'View details', key: 'viewDetails', align: 'center' },
] as const)

const xsHeaders = ref([
  { title: 'Machine', key: 'min' },
  { title: 'Details', key: 'viewDetails', align: 'center' },
] as const)

const smHeaders = ref([
  { title: 'Machine', key: 'min' },
  {
    title: 'Last seen',
    key: 'lastSeenOrOnline',
    value: (item: any) => shortTs(item.lastSeen),
  },
  { title: 'Details', key: 'viewDetails', align: 'center' },
] as const)

const mdHeaders = ref([
  { title: 'Machine', key: 'nameUser' },
  {
    title: 'IP',
    key: 'ipAddresses',
    value: (item: any) => {
      if ((item.ipAddresses.length = 1)) {
        return item.ipAddresses[0]
      }
      if (item.ipAddresses.length > 1) {
        return item.ipAddresses[0].join(',')
      }
    },
  },
  {
    title: 'Last seen',
    key: 'lastSeenOrOnline',
  },
  { title: 'Actions', key: 'actions', align: 'center', sortable: false },
  { title: 'Details', key: 'viewDetails', align: 'center' },
] as const)

const alert = ref<Alert>({ on: false })
const filterEnterpriseID = ref()
const filterUser = ref()
const filterOnlineOnly = ref()

const hideFooter = computed(() => {
  return totalItems.value <= itemsPerPage.value
})
const itemsPerPage = computed(() => {
  return isAdmin.value ? 20 : 100
})
const loading = ref(false)
const loadOptions = ref()
const search = ref('')
const serverItems = ref<V1Node[]>()
const totalItems = ref(0)

const store = useUserStore()
const { isAdmin, isNetworkAdmin, namespace, isSysAdmin, user } = storeToRefs(
  store
)

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true
  const uID = user.value?.userID
  if (!uID) {
    alert.value = {
      on: true,
      text: 'Missing user ID.',
    }
    return
  }
  const network = user.value?.networkDomain
  console.log('uid=', uID, 'network=', network)
  var sortBy = options.sortBy[0]?.key
  if (sortBy) {
    sortBy = decamelize(sortBy)
  }

  var forNamespace = namespace.value
  if (isSysAdmin.value) {
    forNamespace = filterEnterpriseID.value
  }

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceListNodes(
      isAdmin.value
        ? undefined
        : isNetworkAdmin.value
        ? network
          ? undefined
          : uID
        : uID,
      [],
      forNamespace,
      isAdmin.value ? undefined : network,
      filterOnlineOnly.value,
      filterUser.value ? "username" : undefined,
      filterUser.value,
      sortBy,
      options.sortBy[0]?.order == 'desc' ? true : false,
      options.page,
      options.itemsPerPage
    )
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.nodes ?? []
    console.log('nodes:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading items.')
  loading.value = false
}

const headers = computed(() => {
  if (isSysAdmin.value) {
    return adminViewHeaders.value
  }
  if (lgAndUp.value) {
    return lgHeaders.value
  } else if (mdAndUp.value) {
    return mdHeaders.value
  } else if (smAndUp.value) {
    return smHeaders.value
  } else {
    return xsHeaders.value
  }
})

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
  <v-container class="ma-6" fluid>
    <Alert v-model="alert"></Alert>
    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-col>
        <v-chip size="large">Machines</v-chip>
        <v-chip size="large" class="mx-2 text-bold">{{ totalItems }}</v-chip>
        <v-chip v-if="!isSysAdmin" variant="text"
          >Network Domain: {{ user?.networkDomain }}
        </v-chip>
      </v-col>
      <v-col justify="end" class="text-right"
        ><RefreshButton @refresh="loadItems(loadOptions)"
      /></v-col>
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
        <v-switch
          v-model="filterOnlineOnly"
          color="green"
          label="Online Only"
          density="compact"
          @update:modelValue="loadItems(loadOptions)"
        />
      </v-col>
      <v-col cols="12" md="2">
        <v-btn
          color="primary"
          @click="applyFilters"
        >
          Filter
        </v-btn>
      </v-col>
      <v-col cols="12" md="2" align="end">
        <v-btn
          variant="outlined"
          @click="clearFilters"
        >
          Clear Filters
        </v-btn>
      </v-col>
    </v-row>

    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :hide-default-footer="hideFooter"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:item.userID="{ item }">
        <ShortenTextChip
          :shown="23"
          :text="item.user?.name"
          withSuffix
        ></ShortenTextChip>
      </template>

      <template v-slot:item.givenName="{ item }">
        <span
          class="font-weight-bold text-primary cursor-pointer"
          @click.stop="navigateToDetails(item)"
          >{{ item.givenName }}</span
        >
      </template>
      <template v-slot:item.nameUser="{ item }">
        <p
          class="font-weight-bold text-primary cursor-pointer"
          @click.stop="navigateToDetails(item)"
        >
          {{ item.givenName }}
        </p>
        <p>{{ item.user?.loginName }}</p>
      </template>
      <template v-slot:item.min="{ item }">
        <p>
          <span
            class="me-1 font-weight-bold text-primary cursor-pointer"
            @click.stop="navigateToDetails(item)"
            >{{ item.givenName }}</span
          >
          <span>{{ item.hostinfo?.os }}</span>
        </p>
        <p>{{ item.user?.loginName }}</p>
        <p>
          {{
            (item.ipAddresses?.length ?? 0) > 1
              ? `${item.ipAddresses?.length} addresses`
              : `${item.ipAddresses?.length} address`
          }}
        </p>
        <p>
          <span v-if="formatExpiry(item.expiry)"
            >Expire {{ formatExpiry(item.expiry) }}</span
          >
          <span variant="text" v-else class="text-error">Expired</span>
        </p>
      </template>
      <template v-slot:item.lastSeenOrOnline="{ item }">
        <v-icon v-if="item.online" size="12" color="green">mdi-circle</v-icon>
        <span v-if="item.online" class="mx-1 text-grey--text text-caption"
          >Online</span
        >
        <span v-else>{{ shortTs(item.lastSeen) }}</span>
      </template>
      <template v-slot:item.online="{ item }">
        <v-icon size="12" :color="item.online ? 'green' : 'grey'"
          >mdi-circle</v-icon
        >
      </template>
      <template v-slot:item.viewDetails="{ item }">
        <MoreButton @click="navigateToDetails(item)" />
      </template>
      <template v-slot:item.actions="{ item }">
        <DeleteNodeButton
          :item="item"
          v-model:alert="alert"
          @deleted="loadItems(loadOptions)"
        >
        </DeleteNodeButton>
      </template>
    </v-data-table-server>
  </v-container>
</template>
