<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'
import { useRouter } from 'vue-router'
import { User, WgDevice, WgNode } from '@/clients/manager/api'
import { useCurrentNode } from '@/composables/useCurrentNode'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI, vpnAPI, wgAPI } from '@/plugins/api'
import { shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { hexToBase64 } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'

const { smAndUp, mdAndUp, lgAndUp } = useDisplay()
const router = useRouter()
const { setCurrentNode } = useCurrentNode()

const lgHeaders = ref([
  { title: 'Name', key: 'name' },
  {
    title: 'Addresses',
    key: 'addresses',
    value: (item: any) => item.addresses?.join(', ') || 'N/A',
  },
  {
    title: 'Endpoints',
    key: 'endpoints',
    value: (item: any) => item.endpoints?.join(', ') || 'N/A',
  },
  { title: 'Public Key', key: 'publicKey' },
  { title: 'Online', key: 'online' },
] as const)

const adminViewHeaders = ref([
  { title: 'ID', key: 'id' },
  { title: 'Enterprise ID', key: 'namespace' },
  ...lgHeaders.value,
] as const)

const smHeaders = ref([
  { title: 'Name', key: 'name' },
  { title: 'Online', key: 'online' },
] as const)

// Client table headers


const clientSmHeaders = ref([
  { title: 'Name', key: 'name' },
  { title: 'Server', key: 'wgName' },
  {
    title: 'Public Key',
    key: 'publicKey',
  },
] as const)

const clientLgHeaders = ref([
  ...clientSmHeaders.value,
  {
    title: 'Addresses',
    key: 'addresses',
    value: (item: any) => item.addresses?.join(', ') || 'N/A',
  },
  {
    title: 'Node ID',
    key: 'nodeID',
  },
] as const)
const alert = ref<Alert>({ on: false })
const loading = ref(false)
const loadOptions = ref()
const search = ref('')
const serverItems = ref<WgNode[]>([])
const totalItems = ref(0)
const itemsPerPage = ref(10)

// WireGuard clients (devices) variables
const clientLoading = ref(false)
const clientLoadOptions = ref()
const clientItems = ref<WgDevice[]>([])
const clientTotalItems = ref(0)
const clientOnlineCount = ref(0)
const clientItemsPerPage = ref(10)

const store = useUserStore()
const { isAdmin, isNetworkAdmin, namespace, isSysAdmin, user } = storeToRefs(
  store
)

// WireGuard-only node creation variables
const wgOnlyNodeDialog = ref(false)
const wgConfigDialog = ref(false)
const wgConfig = ref('')
const selectedUser = ref<string>()
const selectedWgGateway = ref<string>()
const hostname = ref('')
const dnsServers = ref('')
const mtu = ref()
const wgLoading = ref(false)
const wgGateways = ref<WgNode[]>([])
const allUsers = ref<User[]>([])

onMounted(async () => {
  await loadAllUsers()
  await loadWgGateways()
})

async function loadAllUsers() {
  if (isSysAdmin.value || (!isAdmin.value && !isNetworkAdmin.value)) {
    // Don't load users if not a (network) admin or sysadmin
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await userAPI.getUserList([])
    allUsers.value = ret?.data.users ?? []
    console.log('users:', allUsers.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading all users.')
  loading.value = false
}

async function loadWgGateways() {
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await wgAPI.listWgNodes([], 1, 100) // Get first 100 gateways
    wgGateways.value = ret?.data.items ?? []
    console.log('wg gateways:', wgGateways.value)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading WG gateways.')
  loading.value = false
}

async function loadItems(options: any) {
  loadOptions.value = options
  loading.value = true

  const ret = await tryRequest(async () => {
    const ret = await wgAPI.listWgNodes([], options.page, options.itemsPerPage)
    totalItems.value = ret?.data.total ?? 0
    serverItems.value = ret?.data.items ?? []
    console.log('wg servers:', serverItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading WG servers.')
  loading.value = false
}

async function loadClientItems(options: any) {
  clientLoadOptions.value = options
  clientLoading.value = true

  const ret = await tryRequest(async () => {
    const ret = await wgAPI.listVpnDevice(
      [],
      true,
      undefined,
      options.page,
      options.itemsPerPage
    )
    clientTotalItems.value = ret?.data.total ?? 0
    clientItems.value = ret?.data.devices ?? []
    clientOnlineCount.value = ret?.data.online ?? 0
    console.log('wg clients:', clientItems.value, ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading WG clients.')
  clientLoading.value = false
}

const headers = computed(() => {
  if (isSysAdmin.value) {
    return adminViewHeaders.value
  }
  if (lgAndUp.value) {
    return lgHeaders.value
  } else if (mdAndUp.value || smAndUp.value) {
    return smHeaders.value
  } else {
    return smHeaders.value
  }
})

const clientHeaders = computed(() => {
  if (lgAndUp.value) {
    return clientLgHeaders.value
  } else {
    return clientSmHeaders.value
  }
})

const gatewayEnabled = computed(() => {
  return (
    allUsers.value.filter((u) => u.networkSetting?.gatewayEnabled).length > 0
  )
})

function openWgOnlyNodeDialog() {
  if (allUsers.value.length <= 1) {
    selectedUser.value = allUsers.value[0]?.userID
  }
  if (wgGateways.value.length <= 1) {
    selectedWgGateway.value = wgGateways.value[0]?.name
  }
  wgOnlyNodeDialog.value = true
}

async function createWgOnlyNode() {
  if (!selectedUser.value) {
    alert.value = {
      on: true,
      title: 'Error',
      text: 'Please select a user',
      type: 'error',
    }
    return
  }

  if (!selectedWgGateway.value) {
    alert.value = {
      on: true,
      title: 'Error',
      text: 'Please select a WireGuard gateway',
      type: 'error',
    }
    return
  }

  wgLoading.value = true
  const ret = await tryRequest(async () => {
    const nodeName = hostname.value.trim()
    const wgDevice: WgDevice = {
      userID: selectedUser.value!,
      deviceID: '00000000-0000-0000-0000-000000000000', // Null UUID
      wgID: '', // Use wg gateway name is good enough
      wgName: selectedWgGateway.value!, // Selected gateway name
      name: nodeName, // User-provided hostname or generated name
      namespace: namespace.value || '',
      publicKey: '', // Will be generated by backend
      addresses: [], // Will be assigned by backend
      allowedIps: [], // Will be configured by backend
      labels: [], // Empty labels array
    }

    const dnsServerList = dnsServers.value.trim() ? dnsServers.value : undefined

    const response = await wgAPI.addVpnDevice(
      wgDevice,
      selectedUser.value,
      true, // generateWgClientConfig
      dnsServerList,
      mtu.value
    )

    // Store the config and show the config dialog
    wgConfig.value = response.data
    wgOnlyNodeDialog.value = false
    wgConfigDialog.value = true

    // Refresh the gateways list and clients list
    loadItems(loadOptions.value)
    loadClientItems(clientLoadOptions.value)
  })

  if (ret) {
    alert.value = ret
  }
  wgLoading.value = false
}

function saveWgConfig() {
  const blob = new Blob([wgConfig.value], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const configName = hostname.value.trim() || `wg-client-${Date.now()}`
  const fileName = `${configName}.conf`
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)

  newToast({
    on: true,
    color: 'green',
    text: `Configuration downloaded to ${fileName}`,
  })
}

async function viewNodeDetails(item: WgDevice) {
  if (!item.nodeID) {
    alert.value = {
      on: true,
      title: 'Error',
      text: 'Node ID is not available for this device',
      type: 'error',
    }
    return
  }
  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceGetNode(
      item.nodeID?.toString() || ''
    )
    if (!ret || !ret.data || !ret.data.node) {
      alert.value = {
        on: true,
        title: 'Error',
        text: 'Failed to get node details',
        type: 'error',
      }
      return
    }
    setCurrentNode(ret?.data?.node)
    router.push('/ui/vpn-node-details')
  })
  if (ret) {
    alert.value = ret
  }
}
</script>

<template>
  <v-container class="ma-6" fluid>
    <Alert v-model="alert"></Alert>
    <v-row align="center">
      <img
        src="@/assets/wireguard.svg"
        class="mx-2"
        alt="WireGuard"
        width="64"
        height="64"
      />
      <v-col>
        <h2 class="mb-0">WireGuard VPN Servers & Clients</h2>
        <p class="mt-0">
          Manage WireGuard VPN servers and clients connected to this system.
        </p>
      </v-col>
    </v-row>

    <v-row v-if="gatewayEnabled" class="mx-2 my-1" align="center" justify="end">
      <v-col justify="end" class="text-right" align="center">
        <v-btn @click="openWgOnlyNodeDialog">
          Create a WireGuard Client
        </v-btn>
        <p>
          Create a WireGuard client and its configuration to connect to a
          selected WireGuard gateway.
          The configuration can be saved to be imported to your WiFi router e.g.
          a GL.iNet router
        </p>
      </v-col>
    </v-row>

    <v-row class="mx-2 my-1" align="center" justify="space-between">
      <v-col>
        <v-chip size="large" class="mt-2">WireGuard Servers</v-chip>
        <v-chip size="large" class="mx-2 mt-2 text-bold">{{ totalItems }}</v-chip>
        <v-chip v-if="!isAdmin" variant="text"
          >Network Domain: {{ user?.networkDomain }}
        </v-chip>
      </v-col>
      <v-col justify="end" class="text-right"
        ><RefreshButton @refresh="loadItems(loadOptions)"
      /></v-col>
    </v-row>
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :hide-default-footer="totalItems <= itemsPerPage"
      :items="serverItems"
      :items-length="totalItems"
      :loading="loading"
      :search="search"
      @update:options="loadItems"
    >
      <template v-slot:item.publicKey="{ item }">
        <ShortenTextChip
          :text="hexToBase64(item.publicKey, true)"
        ></ShortenTextChip>
      </template>

      <template v-slot:item.online="{ item }">
        <v-icon size="12" :color="item.online ? 'green' : 'grey'"
          >mdi-circle</v-icon
        >
        <span class="ml-1" v-if="!item.online">{{
          shortTs(item.lastSeen)
        }}</span>
      </template>
    </v-data-table-server>

    <!-- WireGuard Clients Section -->
    <v-row class="mx-2 mt-8 mb-2" align="center" justify="space-between">
      <v-col>
        <v-chip size="large" class="mt-2">WireGuard Clients</v-chip>
        <v-chip size="large" class="mx-2 mt-2 text-bold">{{
          clientTotalItems
        }}</v-chip>
      </v-col>
      <v-col justify="end" class="text-right"
        ><RefreshButton @refresh="loadClientItems(clientLoadOptions)"
      /></v-col>
    </v-row>

    <v-data-table-server
      v-model:items-per-page="clientItemsPerPage"
      class="mt-2"
      :headers="clientHeaders"
      :hide-default-footer="clientTotalItems <= clientItemsPerPage"
      :items="clientItems"
      :items-length="clientTotalItems"
      :loading="clientLoading"
      :search="search"
      @update:options="loadClientItems"
    >
      <template v-slot:item.publicKey="{ item }">
        <ShortenTextChip
          :text="hexToBase64(item.publicKey, true)"
        ></ShortenTextChip>
      </template>
      <template v-slot:item.nodeID="{ item }">
        <v-chip @click="viewNodeDetails(item)">{{ item.nodeID }}</v-chip>
      </template>
    </v-data-table-server>
  </v-container>

  <!-- WireGuard-only node creation dialog -->
  <ConfirmDialog
    v-model="wgOnlyNodeDialog"
    title="Create a WireGuard client"
    okText="Create Config"
    :loading="wgLoading"
    :okDisabled="!selectedUser || !selectedWgGateway"
    @ok="createWgOnlyNode"
  >
    <template v-slot:item>
      <p>Create a node as a WireGuard client and its configuration</p>
      <v-form class="mt-4">
        <v-select
          v-if="allUsers.length > 1"
          v-model="selectedUser"
          :items="allUsers"
          item-title="displayName"
          item-value="userID"
          label="Select User"
          required
          variant="outlined"
          density="compact"
          class="mb-4"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="item.raw.displayName"
              :subtitle="`${
                item.raw.logins?.[0]?.login || item.raw.email
              } (${item.raw.userID.substring(0, 8)}...)`"
            ></v-list-item>
          </template>
        </v-select>

        <v-select
          v-if="wgGateways.length > 1"
          v-model="selectedWgGateway"
          :items="wgGateways"
          item-title="name"
          item-value="name"
          label="Select WireGuard Gateway"
          hint="The new node will be using the selected WireGuard gateway as its exit node"
          persistent-hint
          required
          variant="outlined"
          density="compact"
          class="mb-4"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item
              v-bind="props"
              :title="item.raw.name"
              :subtitle="`${item.raw.online ? 'Online' : 'Offline'}`"
            ></v-list-item>
          </template>
        </v-select>

        <v-text-field
          v-model="hostname"
          label="Hostname (optional)"
          placeholder="my-device"
          hint="Custom hostname for the device. Auto-generated if not provided."
          :rules="[
            (v) =>
              !v ||
              (v.length >= 5 && v.length <= 32) ||
              'Hostname must be between 5 and 32 characters',
          ]"
          variant="outlined"
          density="compact"
          persistent-hint
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="dnsServers"
          label="DNS Servers (optional)"
          placeholder="e.g. 8.8.8.8,1.1.1.1"
          hint="Comma-separated list of DNS servers"
          variant="outlined"
          density="compact"
          persistent-hint
          class="mb-4"
        ></v-text-field>
        <v-number-input
          v-model="mtu"
          label="MTU (optional)"
          placeholder="e.g. 1400"
          hint="Maximum Transmission Unit size for the WireGuard interface"
          variant="outlined"
          density="compact"
          :rules="[
            (v) => (v >= 64 && v <= 9000) || 'MTU must be between 64 and 9000',
          ]"
          persistent-hint
        ></v-number-input>
      </v-form>
    </template>
  </ConfirmDialog>

  <!-- WireGuard Config Display Dialog -->
  <v-dialog v-model="wgConfigDialog" max-width="800" persistent>
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
        WireGuard Client Configuration Created
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pt-4">
        <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
          <strong>Important:</strong> The private key is not saved on the
          server. If you lose this configuration, you will need to regenerate a
          new one.
        </v-alert>

        <v-textarea
          v-model="wgConfig"
          label="WireGuard Client Configuration"
          readonly
          variant="outlined"
          rows="15"
          auto-grow
          class="font-monospace"
        ></v-textarea>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-content-save"
          @click="saveWgConfig"
        >
          Save to File
        </v-btn>
        <v-btn @click="wgConfigDialog = false"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
