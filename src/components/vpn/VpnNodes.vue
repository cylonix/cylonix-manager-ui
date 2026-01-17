<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { decamelize } from '@cylonix/humps'
import { V1Node } from '@/clients/headscale/api'
import { UserInvite } from '@/clients/manager/api'
import { useCurrentNode } from '@/composables/useCurrentNode'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI, vpnAPI, parseNodeHealth } from '@/plugins/api'
import { formatExpiry, shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { hexToBase64 } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'
import { useNodesStore } from '@/stores/nodes'

const router = useRouter()
const route = useRoute()
const { setCurrentNode } = useCurrentNode()
const { smAndUp, mdAndUp, lgAndUp, xlAndUp } = useDisplay()

// Get invite code from query parameters
const inviteCode = computed(() => route.query.inviteCode as string | undefined)

// Invite-related state
const inviteDetails = ref<UserInvite | null>(null)
const inviteLoading = ref(false)
const showAcceptInviteDialog = ref(false)
const showRejectInviteDialog = ref(false)

// Share node state
const showShareDialog = ref(false)
const nodeToShare = ref<V1Node | null>(null)

function navigateToDetails(item: V1Node) {
  if (currentTab.value === 'shared-nodes') {
    // Do not allow navigating to details of shared nodes
    return
  }
  setCurrentNode(item)
  router.push('/ui/vpn-node-details')
}

function openShareDialog(item: V1Node) {
  nodeToShare.value = item
  showShareDialog.value = true
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

// Static header definitions (not reactive for better performance)
const adminViewHeaders = [
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
      return `${base64Key.substring(0, 5)}... 0x${item.machineKey.substring(
        5,
        10
      )}...`
    },
  },
  {
    title: 'Node key',
    key: 'nodeKey',
    value: (item: any) => {
      const base64Key = getNodeKeyBase64(item.nodeKey)
      return `${base64Key.substring(0, 5)}... 0x${item.nodeKey.substring(
        8,
        13
      )}...`
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
  { title: 'Online', key: 'lastSeenOrOnline' },
  { title: 'Health', key: 'health' },
  { title: 'Share to', key: 'shareToUsers' },
  {
    title: 'Actions',
    key: 'actions',
    align: 'center' as const,
    sortable: false,
  },
] as const

const lgHeaders = [
  { title: 'Name', key: 'givenName' },
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
  { title: 'Online', key: 'online' },
  {
    title: 'Expiry',
    key: 'expiry',
    value: (item: any) => formatExpiry(item.expiry),
  },
  { title: 'Shared To', key: 'sharedTo' },
  { title: 'Health', key: 'health' },
  {
    title: 'Actions',
    key: 'actions',
    align: 'center' as const,
    sortable: false,
  },
] as const

const lgHeadersWithUser = [
  { title: 'User', key: 'userID', value: (item: any) => item.user.loginName },
  ...lgHeaders,
] as const

const xlHeaders = [
  ...lgHeaders,
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
] as const

const xlHeadersWithUser = [
  { title: 'User', key: 'userID', value: (item: any) => item.user.loginName },
  ...xlHeaders,
] as const

const xsHeaders = [
  { title: 'Machine', key: 'min' },
  { title: 'Details', key: 'viewDetails', align: 'center' as const },
] as const

const smHeaders = [
  { title: 'Machine', key: 'min' },
  {
    title: 'Last seen',
    key: 'lastSeenOrOnline',
  },
] as const

const mdHeaders = [
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
  {
    title: 'Actions',
    key: 'actions',
    align: 'center' as const,
    sortable: false,
  },
] as const

const alert = ref<Alert>({ on: false })
const filterEnterpriseID = ref()
const filterUser = ref()
const filterGivenName = ref()
const filterOnlineOnly = ref()

// Tab state for regular vs shared nodes
const currentTab = ref<'my-nodes' | 'shared-nodes'>('my-nodes')

// Expiry management
const expiryMenuNode = ref<V1Node | null>(null)
const showDisableExpiryDialog = ref(false)
const showExpireNowDialog = ref(false)
const showSetExpiryDialog = ref(false)
const newExpiryDate = ref<Date | null>(null)
const expiryLoading = ref(false)

const hideFooter = computed(() => {
  return totalItems.value <= itemsPerPage.value
})
const itemsPerPage = ref(20)
const loading = ref(false)
const loadOptions = ref()
const loadOptionsMyNodes = ref()
const loadOptionsSharedNodes = ref()
const search = ref('')

// Stores
const userStore = useUserStore()
const nodesStore = useNodesStore()
const { isAdmin, isNetworkAdmin, namespace, isSysAdmin, user } = storeToRefs(
  userStore
)
const { myNodes, totalMyNodes, sharedNodes, totalSharedNodes, allUsers } =
  storeToRefs(nodesStore)

// Computed properties that switch based on current tab
const serverItems = computed(() => {
  return currentTab.value === 'shared-nodes' ? sharedNodes.value : myNodes.value
})
const totalItems = computed(() => {
  return currentTab.value === 'shared-nodes'
    ? totalSharedNodes.value
    : totalMyNodes.value
})

const showTabs = computed(() => {
  return !isSysAdmin.value && !isAdmin.value && isNetworkAdmin.value
})

onMounted(async () => {
  if (inviteCode.value) {
    await loadInviteDetails()
  }
  await loadAllUsers()
})

async function loadInviteDetails() {
  if (!inviteCode.value) return

  inviteLoading.value = true
  const ret = await tryRequest(async () => {
    const response = await userAPI.getUserInvite(inviteCode.value!)
    inviteDetails.value = response.data
    console.log('Invite details:', inviteDetails.value)
  })
  if (ret) {
    alert.value = ret
  }
  inviteLoading.value = false
}

async function handleAcceptInvite() {
  if (!inviteCode.value || !user.value?.email) return

  inviteLoading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.updateUserInvite(
      inviteCode.value!,
      'accepted',
      user.value!.email!
    )
    newToast({
      on: true,
      color: 'green',
      text: 'Invite accepted successfully!',
    })
    showAcceptInviteDialog.value = false
    // Clear invite details after accepting
    inviteDetails.value = null
    // Remove invite code from URL
    router.replace({ query: {} })
    // Reload the page data
    clearCachedData()
    await loadItems(loadOptions.value, true)
  })
  if (ret) {
    alert.value = ret
  }
  inviteLoading.value = false
}

async function handleRejectInvite() {
  if (!inviteCode.value || !user.value?.email) return

  inviteLoading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.updateUserInvite(
      inviteCode.value!,
      'rejected',
      user.value!.email!
    )
    newToast({
      on: true,
      color: 'info',
      text: 'Invite rejected.',
    })
    showRejectInviteDialog.value = false
    // Clear invite details after rejecting
    inviteDetails.value = null
    // Remove invite code from URL
    router.replace({ query: {} })
  })
  if (ret) {
    alert.value = ret
  }
  inviteLoading.value = false
}

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

async function loadItems(options: any, forceRefresh = false) {
  // Store options based on current tab
  if (!options) {
    options =
      currentTab.value === 'shared-nodes'
        ? loadOptionsSharedNodes.value
        : loadOptionsMyNodes.value
  } else {
    if (currentTab.value === 'shared-nodes') {
      loadOptionsSharedNodes.value = options
    } else {
      loadOptionsMyNodes.value = options
    }
  }
  if (!options) {
    options = {
      page: 1,
      itemsPerPage: itemsPerPage.value,
      sortBy: [],
      groupBy: [],
      groupDesc: [],
      multiSort: false,
      mustSort: false,
    }
  }
  loadOptions.value = options

  // Check if we already have valid cached data for this tab
  const isSharedTab = currentTab.value === 'shared-nodes'
  const hasCachedData = isSharedTab
    ? nodesStore.isSharedNodesValid()
    : nodesStore.isMyNodesValid()

  if (hasCachedData && !forceRefresh) {
    // Valid cached data exists for this tab, skip loading
    console.log(`Using cached data for ${currentTab.value}`)
    return
  }

  loading.value = true
  const uID = user.value?.userID
  if (!uID) {
    alert.value = {
      on: true,
      text: 'Missing user ID.',
      by: 'loadItems',
    }
    loading.value = false
    return
  }
  const network = user.value?.networkDomain
  console.log('uid=', uID, 'network=', network)

  var forNamespace = namespace.value
  if (isSysAdmin.value) {
    forNamespace = filterEnterpriseID.value
  }

  let sortBy: string | undefined
  let sortDesc: string | undefined
  for (const [i, sort] of options.sortBy.entries()) {
    if (i === 0) {
      sortBy = decamelize(sort.key)
      if (sortBy === 'online') {
        sortBy = 'last_seen'
      } else if (sortBy === 'name') {
        sortBy = 'given_name'
      }
      sortDesc = sort.order ?? ''
    } else {
      sortBy = sortBy + ',' + decamelize(sort.key)
      sortDesc = sortDesc + ',' + (sort.order ?? '')
    }
  }

  // Build filter fields and values
  const filterFields: string[] = []
  const filterValues: string[] = []
  if (filterUser.value) {
    filterFields.push('username')
    filterValues.push(filterUser.value)
  }
  if (filterGivenName.value) {
    filterFields.push('given_name')
    filterValues.push(filterGivenName.value)
  }

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceListNodes(
      isAdmin.value
        ? undefined
        : isNetworkAdmin.value && currentTab.value !== 'shared-nodes'
        ? network
          ? undefined
          : uID
        : uID,
      [],
      forNamespace,
      isAdmin.value ? undefined : network,
      filterOnlineOnly.value,
      filterFields.length > 0 ? filterFields.join(',') : undefined,
      filterValues.length > 0 ? filterValues.join(',') : undefined,
      sortBy,
      sortDesc,
      options.page,
      options.itemsPerPage,
      currentTab.value === 'shared-nodes' ? true : undefined
    )

    // Save to appropriate store based on current tab
    if (currentTab.value === 'shared-nodes') {
      nodesStore.setSharedNodes(ret?.data.nodes ?? [], ret?.data.total ?? 0)
    } else {
      nodesStore.setMyNodes(ret?.data.nodes ?? [], ret?.data.total ?? 0)
    }
    console.log('nodes:', ret?.data.nodes, ret?.data)
  })
  if (ret) {
    ret.by = 'loadItems'
    alert.value = ret
  } else {
    if (alert.value && alert.value.by === 'loadItems') {
      alert.value = { on: false }
    }
  }
  console.log('Done loading items.')
  loading.value = false
}

const headersWithoutDetails = computed(() => {
  if (isSysAdmin.value) {
    return adminViewHeaders
  }
  if (xlAndUp.value) {
    if (allUsers.value.length > 1) {
      return xlHeadersWithUser
    }
    return xlHeaders
  }
  if (lgAndUp.value) {
    if (allUsers.value.length > 1) {
      return lgHeadersWithUser
    }
    return lgHeaders
  } else if (mdAndUp.value) {
    return mdHeaders
  } else if (smAndUp.value) {
    return smHeaders
  } else {
    return xsHeaders
  }
})

const headers = computed(() => {
  const viewDetails = {
    title: 'View details',
    key: 'viewDetails',
    align: 'center' as const,
  }
  if (currentTab.value === 'shared-nodes') {
    // Do not show "View details" column for shared nodes
    return headersWithoutDetails.value
  }
  return [...headersWithoutDetails.value, viewDetails]
})

function clearCachedData() {
  // Clear cached data for current tab to force reload
  if (currentTab.value === 'shared-nodes') {
    nodesStore.clearSharedNodes()
  } else {
    nodesStore.clearMyNodes()
  }
}

function refreshData() {
  loadItems(loadOptions.value, true)
  loadAllUsers(true)
}

function applyFilters() {
  clearCachedData()
  loadItems(loadOptions.value, true)
}

function clearFilters() {
  filterEnterpriseID.value = undefined
  filterUser.value = undefined
  filterGivenName.value = undefined
  filterOnlineOnly.value = undefined
  clearCachedData()
  loadItems(loadOptions.value, true)
}

// Expiry management functions
function openExpiryMenu(item: V1Node, option: 'disable' | 'set' | 'now') {
  expiryMenuNode.value = item
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
  if (!expiryMenuNode.value?.id) return

  expiryLoading.value = true
  const ret = await tryRequest(async () => {
    await vpnAPI.headscaleServiceExpireNode(
      expiryMenuNode.value!.id!,
      '0001-01-01T00:00:00Z' // Zero timestamp to disable expiry
    )
    newToast({
      on: true,
      color: 'green',
      text: `Successfully disabled expiry for ${
        expiryMenuNode.value!.givenName
      }`,
    })
    showDisableExpiryDialog.value = false
    clearCachedData()
    await loadItems(loadOptions.value, true)
  })
  if (ret) {
    alert.value = ret
  }
  expiryLoading.value = false
}

async function confirmExpireNow() {
  if (!expiryMenuNode.value?.id) return

  expiryLoading.value = true
  const ret = await tryRequest(async () => {
    // Passing undefined expires the node immediately
    await vpnAPI.headscaleServiceExpireNode(expiryMenuNode.value!.id!)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully expired ${expiryMenuNode.value!.givenName}`,
    })
    showExpireNowDialog.value = false
    clearCachedData()
    await loadItems(loadOptions.value, true)
  })
  if (ret) {
    alert.value = ret
  }
  expiryLoading.value = false
}

async function confirmSetExpiry() {
  if (!expiryMenuNode.value?.id || !newExpiryDate.value) return

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
    await vpnAPI.headscaleServiceExpireNode(
      expiryMenuNode.value!.id!,
      newExpiryDate.value!.toISOString()
    )
    newToast({
      on: true,
      color: 'green',
      text: `Successfully set expiry for ${
        expiryMenuNode.value!.givenName
      } to ${newExpiryDate.value!.toLocaleDateString()}`,
    })
    showSetExpiryDialog.value = false
    await loadItems(loadOptions.value, true)
  })
  if (ret) {
    alert.value = ret
  }
  expiryLoading.value = false
}

const currentSharedNode = ref<V1Node | null>(null)
const rejectingSharedNode = ref(false)
const showRejectSharedNodeDialog = ref(false)
function rejectSharedNode(item: V1Node) {
  currentSharedNode.value = item
  showRejectSharedNodeDialog.value = true
}
async function handleRejectSharedNode(item: V1Node) {
  if (!item.id || !user.value?.userID) return

  rejectingSharedNode.value = true
  const ret = await tryRequest(async () => {
    await vpnAPI.headscaleServiceUpdateNodeShareToUser(item.id!, {
      delAcceptedShareToUser: user.value!.email,
      namespace: namespace.value,
    })
    newToast({
      on: true,
      color: 'success',
      text: `Rejected shared machine ${item.givenName}`,
    })
    clearCachedData()
    await loadItems(loadOptions.value, true)
  })
  if (ret) {
    ret.by = 'rejectSharedNode'
    alert.value = ret
  } else {
    if (alert.value && alert.value.by === 'rejectSharedNode') {
      alert.value = { on: false }
    }
  }
  showRejectSharedNodeDialog.value = false
  rejectingSharedNode.value = false
}

/**
 * format the lastSeen time in a readable way
 * @param lastSeen the lastSeen time in nanoseconds (Unix timestamp from headscale)
 */
</script>
<template>
  <v-container class="ma-6" fluid>
    <Alert v-model="alert"></Alert>

    <!-- Display invite notification if present -->
    <v-alert
      v-if="inviteDetails && !inviteDetails.shareNodeName"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      <v-row align="center">
        <v-col>
          <strong>You've been invited!</strong>
          <p class="mt-2">
            You are invited to join the network by
            <strong>{{
              inviteDetails.invitedBy.displayName ||
              inviteDetails.invitedBy.email
            }}</strong>
          </p>
        </v-col>
      </v-row>
    </v-alert>

    <!-- Display node share invite with action buttons -->
    <v-alert
      v-if="inviteDetails && inviteDetails.shareNodeName"
      type="info"
      variant="tonal"
      class="mb-4"
    >
      <v-row align="center">
        <v-col>
          <strong>Machine Share Invitation</strong>
          <p class="mt-2">
            <strong>{{
              inviteDetails.invitedBy.displayName
                ? inviteDetails.invitedBy.displayName +
                  ' (' +
                  inviteDetails.invitedBy.email +
                  ')'
                : inviteDetails.invitedBy.email
            }}</strong>
            has invited you to access the machine:
            <strong>{{ inviteDetails.shareNodeName }}</strong>
          </p>
        </v-col>
        <v-col cols="auto">
          <v-btn
            color="success"
            class="me-4"
            @click="showAcceptInviteDialog = true"
            :loading="inviteLoading"
          >
            Accept
          </v-btn>
          <v-btn
            color="error"
            variant="outlined"
            @click="showRejectInviteDialog = true"
            :loading="inviteLoading"
          >
            Reject
          </v-btn>
        </v-col>
      </v-row>
    </v-alert>

    <!-- Tabs for My Nodes vs Shared Nodes -->
    <v-tabs
      v-if="showTabs"
      v-model="currentTab"
      class="mx-2 mb-4"
      color="primary"
      @update:model-value="loadItems(undefined, false)"
    >
      <v-tab value="my-nodes">My Machines</v-tab>
      <v-tab value="shared-nodes">Machines Shared With Me</v-tab>
    </v-tabs>

    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-col>
        <v-chip size="large">Machines</v-chip>
        <v-chip size="large" class="mx-2 text-bold">{{ totalItems }}</v-chip>
        <v-chip v-if="!isSysAdmin" variant="text"
          >Network Domain: {{ user?.networkDomain }}
        </v-chip>
      </v-col>
      <v-col justify="end" class="text-right"
        ><RefreshButton @refresh="refreshData"
      /></v-col>
    </v-row>

    <!-- Filter Row -->
    <v-row class="mx-2 mt-4 mb-2" align="start" justify="space-between">
      <v-col cols="12" lg="2" v-if="isSysAdmin">
        <v-text-field
          v-model="filterEnterpriseID"
          label="Filter by Enterprise ID"
          clearable
          density="compact"
        />
      </v-col>
      <v-col
        cols="12"
        lg="2"
        v-if="isAdmin || (isNetworkAdmin && allUsers.length > 1)"
      >
        <v-text-field
          v-model="filterUser"
          label="Filter by User"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" lg="2">
        <v-text-field
          v-model="filterGivenName"
          label="Filter by Name"
          clearable
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="4" lg="2">
        <v-switch
          class="ms-2"
          v-model="filterOnlineOnly"
          color="green"
          label="Online Only"
          density="compact"
          @update:modelValue="loadItems(loadOptions, true)"
        />
      </v-col>
      <v-col cols="12" md="4" lg="2" align="end">
        <v-btn class="me-2" color="primary" @click="applyFilters">
          Filter
        </v-btn>
      </v-col>
      <v-col cols="12" md="4" lg="2" align="end">
        <v-btn class="me-2" variant="outlined" @click="clearFilters">
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
      @update:options="(options) => loadItems(options, true)"
    >
      <template v-slot:item.userID="{ item }">
        <ShortenTextChip
          :shown="23"
          :text="item.user?.name"
          withSuffix
        ></ShortenTextChip>
      </template>

      <template v-slot:item.health="{ item }">
        <ShortenTextChip
          v-if="item.health"
          :shown="23"
          :text="
            parseNodeHealth(item.health)?.subsys +
            ': ' +
            parseNodeHealth(item.health)?.error
          "
          :shortText="parseNodeHealth(item.health)?.subsys"
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
        <p>
          <VpnExpiryMenu
            :expiry="item.expiry"
            withPrefix
            :disabled="currentTab === 'shared-nodes'"
            @set="openExpiryMenu(item, 'set')"
            @disable="openExpiryMenu(item, 'disable')"
            @now="openExpiryMenu(item, 'now')"
          />
        </p>
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
          <VpnExpiryMenu
            :expiry="item.expiry"
            withPrefix
            :disabled="currentTab === 'shared-nodes'"
            @set="openExpiryMenu(item, 'set')"
            @disable="openExpiryMenu(item, 'disable')"
            @now="openExpiryMenu(item, 'now')"
          />
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
      <template v-slot:item.expiry="{ item }">
        <VpnExpiryMenu
          :expiry="item.expiry"
          :disabled="currentTab === 'shared-nodes'"
          @set="openExpiryMenu(item, 'set')"
          @disable="openExpiryMenu(item, 'disable')"
          @now="openExpiryMenu(item, 'now')"
        />
      </template>
      <template
        v-if="currentTab !== 'shared-nodes'"
        v-slot:item.sharedTo="{ item }"
      >
        <v-menu v-if="item.shareToUsers && item.shareToUsers.length > 0">
          <template v-slot:activator="{ props }">
            <v-btn variant="plain" v-bind="props" text>
              {{ item.shareToUsers.length }} User{{
                item.shareToUsers.length > 1 ? 's' : ''
              }}
              <v-icon right>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item
              v-for="(user, index) in item.shareToUsers"
              :key="index"
            >
              <v-list-item-title>{{ user }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <template
        v-if="currentTab !== 'shared-nodes'"
        v-slot:item.viewDetails="{ item }"
      >
        <MoreButton @click="navigateToDetails(item)" />
      </template>
      <template v-slot:item.actions="{ item }">
        <template v-if="currentTab === 'shared-nodes'">
          <v-btn
            color="error"
            size="small"
            @click="rejectSharedNode(item)"
            :loading="loading"
          >
            Reject
          </v-btn>
        </template>
        <template v-else>
          <DeleteNodeButton
            :item="item"
            v-model:alert="alert"
            @deleted="loadItems(loadOptions, true)"
          >
          </DeleteNodeButton>
          <ShareNodeButton
            v-if="!isSysAdmin"
            :item="item"
            @click="openShareDialog"
          />
        </template>
      </template>
    </v-data-table-server>

    <!-- Disable Expiry Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDisableExpiryDialog"
      title="Disable Expiry"
      :loading="expiryLoading"
      @ok="confirmDisableExpiry"
    >
      <template v-slot:item
        ><p>
          Are you sure you want to disable expiry for
          <strong>{{ expiryMenuNode?.givenName }}</strong
          >?
        </p>
        <p class="text-caption text-grey mt-2">
          This will set the node to never expire.
        </p></template
      >
    </ConfirmDialog>

    <!-- Expire Now Confirmation Dialog -->
    <ConfirmDialog
      v-model="showExpireNowDialog"
      title="Expire Node Now"
      :loading="expiryLoading"
      @ok="confirmExpireNow"
    >
      <template v-slot:item
        ><p>
          Are you sure you want to expire
          <strong>{{ expiryMenuNode?.givenName }}</strong> immediately?
        </p>
        <p class="text-caption text-error mt-2">
          This will cause the node to be disconnected from the network.
        </p></template
      >
    </ConfirmDialog>

    <!-- Set Expiry Time Dialog -->
    <ConfirmDialog
      v-model="showSetExpiryDialog"
      title="Set Expiry Time"
      :loading="expiryLoading"
      @ok="confirmSetExpiry"
    >
      <template v-slot:item
        ><p class="text-center mb-4">
          Set a new expiry time for
          <strong>{{ expiryMenuNode?.givenName }}</strong>
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
        </p></template
      >
    </ConfirmDialog>

    <!-- Accept Invite Confirmation Dialog -->
    <ConfirmDialog
      v-model="showAcceptInviteDialog"
      title="Accept Invitation"
      :loading="inviteLoading"
      @ok="handleAcceptInvite"
      okColor="success"
      okText="Accept"
    >
      <template v-slot:item>
        <p>
          Are you sure you want to accept this invitation to access
          <strong>{{ inviteDetails?.shareNodeName }}</strong
          >?
        </p>
        <p class="text-caption text-grey mt-2">
          You will be accepting access to this machine.
        </p>
      </template>
    </ConfirmDialog>

    <!-- Reject Invite Confirmation Dialog -->
    <ConfirmDialog
      v-model="showRejectInviteDialog"
      title="Reject Invitation"
      :loading="inviteLoading"
      @ok="handleRejectInvite"
      okColor="error"
      okText="Reject"
    >
      <template v-slot:item>
        <p>
          Are you sure you want to reject this invitation to access
          <strong>{{ inviteDetails?.shareNodeName }}</strong
          >?
        </p>
        <p class="text-caption text-error mt-2">
          This invitation will be declined.
        </p>
      </template>
    </ConfirmDialog>

    <!-- Reject Shared Node Confirmation Dialog -->
    <ConfirmDialog
      v-model="showRejectSharedNodeDialog"
      title="Reject Shared Machine"
      :loading="rejectingSharedNode"
      okText="Reject"
      okColor="error"
      @ok="handleRejectSharedNode(currentSharedNode!)"
    >
      <template v-slot:item>
        <p>
          Are you sure you want to reject sharing of
          <strong>{{ currentSharedNode?.givenName }}</strong> to you?
        </p>
        <p class="text-error mt-2">This sharing will be declined.</p>
      </template>
    </ConfirmDialog>

    <!-- Share Node Dialog -->
    <ShareNodeDialog
      v-model="showShareDialog"
      :node="nodeToShare"
      @shared="loadItems(loadOptions, true)"
    />
  </v-container>
</template>
