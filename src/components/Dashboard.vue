<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'
import { userAPI, tryRequest } from '@/plugins/api'
import type { Alert } from '@/plugins/alert'

//import { formatDistance } from 'date-fns'

//const store = useUserStore()
const { isNetworkAdmin, isAdmin } = storeToRefs(useUserStore())

// Stats
const deviceStats = ref({
  total: 0,
})
const userStats = ref({
  total: 0,
})

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
  const ret = await tryRequest(async () => {
    const stats = await userAPI.getUserSummary()
    console.log('User stats:', stats)
    if (!stats || !stats.data) {
      return
    }
    deviceStats.value = {
      total: stats.data[0]?.deviceCount ?? 0,
    }
    userStats.value = {
      total: stats.data[0]?.userCount ?? 0,
    }
  })
  if (ret) {
    alert.value = ret
  }
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

onMounted(() => {
  fetchDashboardData()
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
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">Total Devices</v-card-title>
          <v-card-text>
            <div class="text-h4">{{ deviceStats.total }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="isNetworkAdmin || isAdmin" cols="12" md="6">
        <v-card>
          <v-card-title class="text-h6">Total Users</v-card-title>
          <v-card-text>
            <div class="text-h4">{{ userStats.total }}</div>
          </v-card-text>
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
