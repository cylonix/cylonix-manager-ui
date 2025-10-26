<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { V1Node, V1RouteSpec } from '@/clients/headscale/api'
import { useCurrentNode } from '@/composables/useCurrentNode'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { formatExpiry, shortTs } from '@/plugins/date'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const { currentNode: nodeItem, setCurrentNode } = useCurrentNode()
const router = useRouter()
const goBack = () => {
  router.back()
}
const store = useUserStore()
const { isAdmin, isNetworkAdmin } = storeToRefs(store)

const alert = ref<Alert>({ on: false })

// Helper functions
const getOSInfo = (item: V1Node) => {
  const os = item.hostinfo?.os || 'Unknown'
  const version = item.hostinfo?.osVersion || ''
  return version ? `${os} (${version})` : os
}

const isExitNode = (item: V1Node) => {
  const routes = item.routes
  if (!routes || routes.length <= 0) {
    return false
  }
  var hasV4 = false
  var hasV6 = false
  for (var r of routes) {
    if (r.prefix === '0.0.0.0/0' && r.enabled) {
      hasV4 = true
    } else if (r.prefix === '::/0' && r.enabled) {
      hasV6 = true
    }
    if (hasV4 && hasV6) {
      return true
    }
  }
  return hasV4 && hasV6
}

const hasExitNodeRoutes = (item: V1Node) => {
  const routes = item.routes
  if (!routes || routes.length <= 0) {
    return false
  }
  var hasV4 = false
  var hasV6 = false
  for (var r of routes) {
    if (r.prefix === '0.0.0.0/0') {
      hasV4 = true
    } else if (r.prefix === '::/0') {
      hasV6 = true
    }
    if (hasV4 && hasV6) {
      return true
    }
  }
  return hasV4 && hasV6
}

const nonDefaultRoutes = (item: V1Node) => {
  const routes = item.routes
  if (!routes || routes.length <= 0) {
    return []
  }
  var nonDefaultRoutes: V1RouteSpec[] = []
  for (var r of routes) {
    if (r.prefix === '0.0.0.0/0' || r.prefix == '::/0') {
      continue
    }
    nonDefaultRoutes.push(r)
  }
  return nonDefaultRoutes
}

const getRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffTime / (1000 * 60))

  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}

const confirmDeleteRouteText = (prefix: string | undefined): string => {
  return (
    `Are you sure you want to delete the route ${prefix}? ` +
    'This action cannot be undone.'
  )
}

async function toggleRoute(route: V1RouteSpec) {
  if (!isNetworkAdmin.value) {
    alert.value = {
      on: true,
      type: 'error',
      title: 'Only Network Admins can enable or disable routes.',
    }
    return
  }
  const id = route.id
  if (!id) {
    alert.value = {
      on: true,
      type: 'error',
      title: `Route ID is missing for route ${route.prefix}`,
    }
    return
  }
  const enable = !route.enabled
  const ret = await tryRequest(async () => {
    enable
      ? await vpnAPI.headscaleServiceEnableRoute(id)
      : await vpnAPI.headscaleServiceDisableRoute(id)
    route.enabled = enable
    newToast({
      on: true,
      color: 'green',
      text: `Successfully ${enable ? 'enabled' : 'disabled'} route ${
        route.prefix
      }`,
    })
  })
  if (ret) {
    alert.value = ret
  }
}

async function toggleExitNode(item: V1Node) {
  if (!isNetworkAdmin.value) {
    return
  }
  const routes = item.routes
  if (!routes || routes.length <= 0) {
    alert.value = {
      on: true,
      type: 'error',
      title: 'No routes found for this node',
    }
    return
  }
  for (var r of routes) {
    if (r.prefix === '0.0.0.0/0' || r.prefix === '::/0') {
      await toggleRoute(r)
    }
  }
}

async function deleteRoute(route: V1RouteSpec) {
  const id = route.id
  if (!id) {
    alert.value = {
      on: true,
      title: `Route ID is missing for route ${route.prefix}`,
    }
    return
  }
  const ret = await tryRequest(async () => {
    await vpnAPI.headscaleServiceDeleteRoute(id)
    newToast({
      on: true,
      color: 'green',
      text: `Successfully deleted route ${route.prefix}`,
    })
    const nodeID = nodeItem.value?.id
    if (!nodeID) {
      return
    }
    const resp = await vpnAPI.headscaleServiceGetNode(nodeID)
    if (!resp || !resp.data.node) {
      return
    }
    setCurrentNode(resp.data.node)
  })
  if (ret) {
    alert.value = ret
  }
}
const addCapDialog = ref(false)
const addCapAlert = ref<Alert>({ on: false })
const newCapability = ref('')
function addCapability() {
  addCapDialog.value = true
}
async function confirmAddCapability() {
  const nodeID = nodeItem.value?.id
  if (!nodeID) {
    addCapAlert.value = {
      on: true,
      title: 'Node ID is missing',
    }
    return
  }
  const capability = newCapability.value.trim()
  if (!capability) {
    addCapAlert.value = {
      on: true,
      title: 'Capability cannot be empty',
    }
    return
  }
  if (
    nodeItem.value?.capabilities &&
    nodeItem.value.capabilities.includes(capability)
  ) {
    addCapAlert.value = {
      on: true,
      title: `Node already has capability ${capability}`,
    }
    return
  }
  const ret = await tryRequest(async () => {
    await vpnAPI.headscaleServiceUpdateNode(nodeID, {
      namespace: nodeItem.value?.namespace,
      addCapabilities: [capability],
    })
    newToast({
      on: true,
      color: 'green',
      text: `Successfully added capability ${capability}`,
    })
    const resp = await vpnAPI.headscaleServiceGetNode(nodeID)
    if (!resp || !resp.data.node) {
      return
    }
    setCurrentNode(resp.data.node)
    newCapability.value = ''
    addCapDialog.value = false
  })
  if (ret) {
    addCapAlert.value = ret
  }
}
</script>
<template>
  <v-container v-if="nodeItem">
    <Alert v-model="alert"></Alert>
    <!-- Header -->
    <v-row>
      <v-col cols="12">
        <v-btn
          @click="goBack"
          prepend-icon="mdi-arrow-left"
          variant="text"
          class="mb-4 my-2"
        >
          Back to Machines
        </v-btn>

        <v-card variant="text">
          <v-card-title class="d-flex align-center">
            <v-row>
              <v-col cols="12" cols-xs="6">
                <v-icon class="mr-3" size="large">mdi-laptop</v-icon>
                <div>
                  <h2>{{ nodeItem.givenName }}</h2>
                  <div class="text-subtitle-1 text-medium-emphasis">
                    {{ nodeItem.user?.loginName }}
                  </div>
                </div>
              </v-col>
              <v-col cols="12" cols-xs="6" align="end">
                <v-chip
                  :color="nodeItem.online ? 'success' : 'error'"
                  size="large"
                >
                  <v-icon start>{{
                    nodeItem.online ? 'mdi-circle' : 'mdi-circle-outline'
                  }}</v-icon>
                  {{ nodeItem.online ? 'Online' : 'Offline' }}
                </v-chip>
                <DeleteNodeButton
                  :item="nodeItem"
                  v-model:alert="alert"
                  @deleted="goBack"
                >
                </DeleteNodeButton>
              </v-col>
            </v-row>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>

    <!-- Routes Setting -->
    <v-row class="mt-4">
      <v-col>
        <v-card variant="text" class="mb-4">
          <v-card-title>Routes Setting</v-card-title>
          <v-card-text>
            <div class="routes-container">
              <v-row class="field-row">
                <v-col cols="8" class="field-title">Exit Node</v-col>
                <v-col cols="4" class="field-value">{{
                  isExitNode(nodeItem as V1Node) ? 'Yes' :
                    hasExitNodeRoutes(nodeItem as V1Node) ? 'Pending Approval' : 'Not Allowed'
                }}</v-col>
              </v-row>
              <v-row
                class="field-row"
                v-if="hasExitNodeRoutes(nodeItem as V1Node)"
              >
                <v-col cols="8" class="field-title"></v-col>
                <v-col cols="4" class="field-value">
                  <v-btn
                    variant="flat"
                    rounded="xs"
                    v-if="isNetworkAdmin"
                    @click="toggleExitNode(nodeItem as V1Node)"
                    >{{ isExitNode(nodeItem as V1Node) ? 'Reject' : 'Approve'}}</v-btn
                  >
                </v-col>
              </v-row>
              <v-row
                align="center"
                v-if="nonDefaultRoutes(nodeItem as V1Node).length > 0"
                class="field-row"
              >
                <v-col cols="8" class="mt-5 field-title">Routes</v-col>
                <v-col cols="4" class="field-value">{{
                  nonDefaultRoutes(nodeItem as V1Node).length
                }}</v-col>
              </v-row>
              <v-row
                align="center"
                v-if="nonDefaultRoutes(nodeItem as V1Node).length > 0"
                v-for="route in nonDefaultRoutes(nodeItem as V1Node)"
                :key="route.prefix"
              >
                <v-col cols="8" class="field-title"
                  ><span class="ml-5 route">{{ route.prefix }}</span>
                  {{ route.enabled ? 'Enabled' : 'Disabled' }}
                  {{ route.isPrimary ? ' (Primary)' : '' }}
                  {{ route.advertised ? ' (Advertised)' : '' }}
                </v-col>
                <v-col cols="4" class="field-value">
                  <v-row
                    ><v-btn
                      variant="tonal"
                      rounded="xs"
                      v-if="isNetworkAdmin || isAdmin"
                      @click="toggleRoute(route)"
                      >{{ route.enabled ? 'Disable' : 'Enable' }}</v-btn
                    >
                    <DeleteButton
                      v-if="!route.enabled"
                      class="ml-2"
                      title="Delete Route"
                      :confirmDeleteText="confirmDeleteRouteText(route.prefix)"
                      @delete="deleteRoute(route)"
                    ></DeleteButton>
                  </v-row>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row class="mt-4">
      <!-- Left Column -->
      <v-col cols="12" md="6">
        <!-- Basic Information -->
        <v-card variant="text" class="mb-4">
          <v-card-title>Basic Information</v-card-title>
          <v-card-text>
            <v-container fluid class="pa-0">
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Creator</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.user?.loginName
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Machine name</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.givenName
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">OS hostname</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.name || ''
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">OS</v-col>
                <v-col
                  cols="8"
                  class="field-value"
                  >{{ getOSInfo(nodeItem as V1Node) }}</v-col
                >
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Device Model</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo?.deviceModel
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Network Domain</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.networkDomain ?? 'Unknown'
                }}</v-col>
              </v-row>
              <v-row class="field-row" v-if="nodeItem.hostinfo?.ipnVersion">
                <v-col cols="4" class="field-title">IPN version</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo?.ipnVersion || 'Unknown'
                }}</v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>

        <!-- Node Details -->
        <v-card variant="text" class="mb-4">
          <v-card-title>Node Details</v-card-title>
          <v-card-text>
            <v-container fluid class="pa-0">
              <v-row class="field-row" v-if="nodeItem.nodeKey">
                <v-col cols="4" class="field-title">Node key</v-col>
                <v-col cols="8" class="field-value font-monospace">{{
                  nodeItem.nodeKey
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Created</v-col>
                <v-col cols="8" class="field-value">{{
                  shortTs(nodeItem.createdAt)
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Last seen</v-col>
                <v-col cols="8" class="field-value">{{
                  getRelativeTime(nodeItem.lastSeen ?? '')
                }}</v-col>
              </v-row>
              <v-row class="field-row" v-if="nodeItem.expiry">
                <v-col cols="4" class="field-title">Key expiry</v-col>
                <v-col cols="8" class="field-value"
                  ><span v-if="formatExpiry(nodeItem.expiry)">{{
                    formatExpiry(nodeItem.expiry)
                  }}</span>
                  <span variant="text" v-else class="text-error"
                    >Expired</span
                  ></v-col
                >
              </v-row>
              <v-row class="field-row" v-if="nodeItem.capabilities">
                <v-col cols="4" class="field-title">Capabilities</v-col>
                <v-col cols="8" class="field-value"
                  >
                  <AddButton
                    @click="addCapability"
                    label="Add Capability"
                  ></AddButton>
                  <div
                    v-for="capability in nodeItem.capabilities"
                    :key="capability"
                    class="font-monospace"
                  >
                    {{ capability }}
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Right Column -->
      <v-col cols="12" md="6">
        <!-- Addresses -->
        <v-card variant="text" class="mb-4">
          <v-card-title>Addresses</v-card-title>
          <v-card-text>
            <v-container fluid class="pa-0">
              <v-row
                class="field-row"
                v-for="(ip, index) in nodeItem.ipAddresses"
                :key="index"
              >
                <v-col cols="4" class="field-title">{{
                  ip.includes(':') ? 'IPv6' : 'IPv4'
                }}</v-col>
                <v-col cols="8" class="field-value font-monospace">{{
                  ip
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Short domain</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.givenName
                }}</v-col>
              </v-row>
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Full domain</v-col>
                <v-col cols="8" class="field-value">{{ nodeItem.name }}</v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>

        <!-- Endpoints -->
        <v-card
          variant="text"
          class="mb-4"
          v-if="nodeItem.endpoints && nodeItem.endpoints.length > 0"
        >
          <v-card-title>Endpoints</v-card-title>
          <v-card-text>
            <v-container fluid class="pa-0">
              <v-row class="field-row">
                <v-col class="field-value">
                  <div
                    v-for="(endpoint, index) in nodeItem.endpoints"
                    :key="index"
                    class="endpoint-item font-monospace"
                  >
                    {{ endpoint }}
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
        <!-- Services -->
        <v-card
          variant="text"
          class="mb-4"
          v-if="nodeItem.hostinfo?.services?.length"
        >
          <v-card-title>Services</v-card-title>
          <v-card-text>
            <v-container fluid class="pa-0">
              <v-row
                class="field-row"
                v-for="service in nodeItem.hostinfo.services"
                :key="service.port"
                align="center"
              >
                <v-col cols="4" class="field-title">{{ service.proto }}</v-col>
                <v-col cols="8" class="field-value">
                  <div class="font-monospace">
                    {{ service.proto }}://:{{ service.port }}
                    {{ service.description }}
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
        <!-- NetInfo -->
        <v-card variant="text" class="mb-4" v-if="nodeItem.hostinfo?.netInfo">
          <v-card-title>Network Information</v-card-title>
          <v-card-text>
            <v-container fluid class="pa-0">
              <v-row
                class="field-row"
                v-if="nodeItem.hostinfo.netInfo.workingIPv6"
              >
                <v-col cols="4" class="field-title">Working IPv6</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.workingIPv6 ? 'Yes' : 'No'
                }}</v-col>
              </v-row>
              <v-row
                class="field-row"
                v-if="nodeItem.hostinfo.netInfo.workingUDP"
              >
                <v-col cols="4" class="field-title">Working UDP</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.workingUDP ? 'Yes' : 'No'
                }}</v-col>
              </v-row>
              <v-row
                class="field-row"
                v-if="nodeItem.hostinfo.netInfo.workingIcmpv4"
              >
                <v-col cols="4" class="field-title">Working ICMPv4</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.workingIcmpv4 ? 'Yes' : 'No'
                }}</v-col>
              </v-row>
              <v-row class="field-row" v-if="nodeItem.hostinfo.netInfo.upnp">
                <v-col cols="4" class="field-title">UPnP</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.upnp ? 'Yes' : 'No'
                }}</v-col>
              </v-row>
              <v-row class="field-row" v-if="nodeItem.hostinfo.netInfo.pmp">
                <v-col cols="4" class="field-title">PMP</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.pmp ? 'Yes' : 'No'
                }}</v-col>
              </v-row>
              <v-row class="field-row" v-if="nodeItem.hostinfo.netInfo.pcp">
                <v-col cols="4" class="field-title">PCP</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.pcp ? 'Yes' : 'No'
                }}</v-col>
              </v-row>
              <v-row
                class="field-row"
                v-if="nodeItem.hostinfo.netInfo.hairPinning"
              >
                <v-col cols="4" class="field-title">Hairpinning</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.hairPinning ? 'Yes' : 'No'
                }}</v-col>
              </v-row>
              <v-row
                class="field-row"
                v-if="nodeItem.hostinfo.netInfo.preferredDerp !== undefined"
              >
                <v-col cols="4" class="field-title">Preferred DERP</v-col>
                <v-col cols="8" class="field-value">{{
                  nodeItem.hostinfo.netInfo.preferredDerp
                }}</v-col>
              </v-row>
              <v-row
                class="field-row"
                v-if="
                  nodeItem.hostinfo.netInfo.derpLatency &&
                  Object.keys(nodeItem.hostinfo.netInfo.derpLatency).length > 0
                "
              >
                <v-col cols="4" class="field-title">DERP latency</v-col>
                <v-col cols="8" class="field-value">
                  <div
                    v-for="(latency, region) in nodeItem.hostinfo.netInfo
                      .derpLatency"
                    :key="region"
                    class="latency-item"
                  >
                    <span>{{ region }}:</span>
                    <span class="text-right"
                      >{{ (latency * 1000).toFixed(0) }}ms</span
                    >
                  </div>
                </v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
        <!-- Tags -->
        <v-card
          variant="text"
          class="mb-4"
          v-if="
            (nodeItem.forcedTags && nodeItem.forcedTags.length > 0) ||
            (nodeItem.invalidTags && nodeItem.invalidTags.length > 0)
          "
        >
          <v-card-title>Tags</v-card-title>
          <v-card-text>
            <div
              v-if="nodeItem.forcedTags && nodeItem.forcedTags.length > 0"
              class="mb-3"
            >
              <h4 class="mb-2">Forced Tags</h4>
              <v-chip-group>
                <v-chip
                  v-for="tag in nodeItem.forcedTags"
                  :key="tag"
                  size="small"
                >
                  {{ tag }}
                </v-chip>
              </v-chip-group>
            </div>
            <div v-if="nodeItem.invalidTags && nodeItem.invalidTags.length > 0">
              <h4 class="mb-2">Invalid Tags</h4>
              <v-chip-group>
                <v-chip
                  v-for="tag in nodeItem.invalidTags"
                  :key="tag"
                  size="small"
                  color="error"
                >
                  {{ tag }}
                </v-chip>
              </v-chip-group>
            </div>
          </v-card-text>
        </v-card>

        <!-- Pre-auth Key -->
        <v-card variant="text" class="mb-4" v-if="nodeItem.preAuthKey">
          <v-card-title>Pre-auth Key</v-card-title>
          <v-card-text>
            <v-container fluid class="pa-0">
              <v-row class="field-row">
                <v-col cols="4" class="field-title">Key</v-col>
                <v-col cols="8" class="field-value font-monospace">{{
                  nodeItem.preAuthKey.key
                }}</v-col>
              </v-row>
              <v-row class="field-row" v-if="nodeItem.preAuthKey.expiration">
                <v-col cols="4" class="field-title">Expiration</v-col>
                <v-col cols="8" class="field-value">{{
                  shortTs(nodeItem.preAuthKey.expiration)
                }}</v-col>
              </v-row>
            </v-container>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- No data state -->
  <v-container v-else>
    <v-row>
      <v-col cols="12" class="text-center">
        <v-btn @click="goBack" prepend-icon="mdi-arrow-left" variant="text">
          Back to Machines
        </v-btn>
        <v-alert type="warning" class="mt-4">
          No node data available. Please select a node from the machines list.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
   <ConfirmDialog v-model="addCapDialog" title="Add Capability" @ok="confirmAddCapability"
    ><template v-slot:item>
      <Alert v-model="addCapAlert"></Alert>
      <v-text-field
        class="mt-4"
        v-model="newCapability"
        label="Capability"
        placeholder="Enter capability"
        outlined
        dense
      ></v-text-field>
    </template>
  </ConfirmDialog>
</template>
<style scoped>
.font-monospace {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.field-row {
  align-items: flex-start;
  margin-bottom: 4px; /* Reduced from default to make lines denser */
}

.field-row:last-child {
  margin-bottom: 0;
}

.field-title {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  padding-right: 16px !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.field-value {
  word-break: break-all;
  padding-left: 0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.endpoint-item {
  margin-bottom: 2px;
  padding-left: 16px;
}

.endpoint-item:last-child {
  margin-bottom: 0;
}

/* Override Vuetify's default container padding for denser layout */
.v-container {
  padding: 0 !important;
}

.v-row {
  margin: 0 !important;
}

.v-col {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}

.latency-item {
  display: flex;
  width: 100px;
  justify-content: space-between;
  padding: 2px 0;
}
.route {
  font-weight: 500;
  width: 200px;
  display: inline-block;
  min-width: 100px;
}
.routes-container {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  padding: 8px;
  margin: 8px;
}
:deep(.v-theme--dark) .routes-container {
  border-color: rgba(255, 255, 255, 0.12);
}
</style>
