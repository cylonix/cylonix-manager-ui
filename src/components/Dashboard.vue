<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { userAPI, tryRequest } from '@/plugins/api'
import type { Alert } from '@/plugins/alert'
import RefreshButton from './buttons/RefreshButton.vue'

//import { formatDistance } from 'date-fns'

//const store = useUserStore()
const { isNetworkAdmin, isAdmin } = storeToRefs(useUserStore())

// Stats
const deviceStats = ref({
  total: 0,
  online: 0,
  offline: 0,
})
const userStats = ref({
  total: 0,
  online: 0,
  offline: 0,
})

const userPieChartItems = ref([
  { key: 'online', title: 'Online', value: 0, color: 'green' },
  { key: 'offline', title: 'Offline', value: 0, color: 'grey' },
])
const devicePieChartItems = ref([
  { key: 'online', title: 'Online', value: 0, color: 'green' },
  { key: 'offline', title: 'Offline', value: 0, color: 'grey' },
])

// Loading states for refresh buttons
const loadingUserStats = ref(false)

// Timer for automatic refresh
let refreshTimer: number | null = null

// Config history
//const configHistory = ref([])

// Fetch dashboard data
async function fetchDashboardData() {
  await Promise.all([
    fetchUserStats(),
    fetchPendingApprovals(),
    fetchConfigHistory(),
  ])
}

const alert = ref<Alert>({ on: false })
async function fetchUserStats() {
  loadingUserStats.value = true
  const ret = await tryRequest(async () => {
    const stats = await userAPI.getUserSummary()
    console.log('User stats:', stats)
    if (!stats || !stats.data) {
      return
    }
    deviceStats.value = {
      total: stats.data[0]?.deviceCount ?? 0,
      online: stats.data[0]?.onlineDeviceCount ?? 0,
      offline:
        (stats.data[0]?.deviceCount ?? 0) -
        (stats.data[0]?.onlineDeviceCount ?? 0),
    }
    userStats.value = {
      total: stats.data[0]?.userCount ?? 0,
      online: stats.data[0]?.onlineUserCount ?? 0,
      offline:
        (stats.data[0]?.userCount ?? 0) - (stats.data[0]?.onlineUserCount ?? 0),
    }
    devicePieChartItems.value = [
      {
        key: 'online',
        title: 'Online',
        value: deviceStats.value.online,
        color: 'green',
      },
      {
        key: 'offline',
        title: 'Offline',
        value: deviceStats.value.offline,
        color: 'grey',
      },
    ]
    userPieChartItems.value = [
      {
        key: 'online',
        title: 'Online',
        value: userStats.value.online,
        color: 'green',
      },
      {
        key: 'offline',
        title: 'Offline',
        value: userStats.value.offline,
        color: 'grey',
      },
    ]
  })
  if (ret) {
    alert.value = ret
  }
  loadingUserStats.value = false
}

async function fetchPendingApprovals() {
  /*if (isAdmin.value) {
    await Promise.all([
      tryRequest(async () => {
        const devices = await deviceApprovalAPI.list()
        pendingDeviceApprovals.value = devices.filter(
          (d) => d.status === 'pending'
        )
      }),
      tryRequest(async () => {
        const users = await userApprovalAPI.list()
        pendingUserApprovals.value = users.filter((u) => u.status === 'pending')
      }),
    ])
  }*/
}

async function fetchConfigHistory() {
  /*await tryRequest(async () => {
    // Replace with actual config history API call
    configHistory.value = await deviceAPI.getConfigHistory()
  })*/
}

// Format timestamp
//function formatTime(timestamp: string) {
//  return formatDistance(new Date(timestamp), new Date(), { addSuffix: true })
//}

function startAutoRefresh() {
  refreshTimer = setInterval(() => {
    fetchDashboardData()
  }, 30000) // 30 seconds
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}
const numberFormatter = new Intl.NumberFormat('en', { useGrouping: true })
function formatNumber(v: any) {
  return numberFormatter.format(v)
}
const legendConfig = ref({ position: 'right' as const })
onMounted(() => {
  fetchDashboardData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<template>
  <v-container>
    <!-- Alert Section -->
    <v-row>
      <v-col cols="12">
        <AlertTable></AlertTable>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row>
      <v-col cols="12" lg="6">
        <v-card>
          <v-card-title class="text-h6">Total Devices</v-card-title>
          <v-card-text>
            <div class="text-h4">{{ deviceStats.total }}</div>
          </v-card-text>
          <v-pie
            :items="devicePieChartItems"
            :legend="legendConfig"
            :tooltip="{
              subtitleFormat: (s) =>
                `${s.value} devices (${(
                  (100 * s.value) /
                  deviceStats.total
                ).toFixed(1)}%)`,
            }"
            inner-cut="75"
            size="300"
            animation
            hide-slice
          >
            <template v-slot:legend-text="{ item }">
              <div class="d-flex ga-6">
                <div>{{ item.title }}</div>
                <div class="ml-auto font-weight-bold">
                  {{ formatNumber(item.value) }}
                </div>
              </div>
            </template>
          </v-pie>
          <v-card-actions class="justify-end"
            ><RefreshButton @click="fetchUserStats" :loading="loadingUserStats"
          /></v-card-actions>
        </v-card>
      </v-col>
      <v-col v-if="isNetworkAdmin || isAdmin" cols="12" lg="6">
        <v-card>
          <v-card-title class="text-h6">Total Users</v-card-title>
          <v-card-text>
            <div class="text-h4">{{ userStats.total }}</div>
          </v-card-text>
          <v-pie
            :items="userPieChartItems"
            :legend="legendConfig"
            :tooltip="{
              subtitleFormat: (s) =>
                `${formatNumber(s.value)} users (${(
                  (100 * s.value) /
                  userStats.total
                ).toFixed(1)}%)`,
            }"
            inner-cut="75"
            size="300"
            animation
            hide-slice
          >
            <template v-slot:legend-text="{ item }">
              <div class="d-flex ga-6">
                <div>{{ item.title }}</div>
                <div class="ml-auto font-weight-bold">
                  {{ formatNumber(item.value) }}
                </div>
              </div>
            </template>
          </v-pie>
          <v-card-actions class="justify-end"
            ><RefreshButton @click="fetchUserStats" :loading="loadingUserStats"
          /></v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <AlarmTable></AlarmTable>
      </v-col>
    </v-row>

    <!-- Config History -->
    <!--v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h6"> Configuration Changes </v-card-title>
          <v-card-text>
            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="item in configHistory"
                :key="item.id"
                :dot-color="item.type === 'update' ? 'primary' : 'warning'"
                size="small"
              >
                <template v-slot:opposite>
                  <span class="text-caption">{{
                    formatTime(item.timestamp)
                  }}</span>
                </template>
                <div class="text-subtitle-2">{{ item.title }}</div>
                <div class="text-caption">{{ item.description }}</div>
              </v-timeline-item>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row-->
  </v-container>
</template>
