<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { V1Node } from '@/clients/headscale/api'
import { useCurrentNode } from '@/composables/useCurrentNode'
import type { Alert } from '@/plugins/alert'
import { formatExpiry, shortTs } from '@/plugins/date'

const { currentNode: nodeItem } = useCurrentNode()
const router = useRouter()
const goBack = () => {
  router.back()
}

const alert = ref<Alert>({ on: false })

// Helper functions
const getOSInfo = (item: V1Node) => {
  const os = item.hostinfo?.os || 'Unknown'
  const version = item.hostinfo?.osVersion || ''
  return version ? `${os} (${version})` : os
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
</style>
