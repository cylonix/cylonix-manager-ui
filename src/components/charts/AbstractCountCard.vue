<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { Alert } from '@/plugins/alert'
import { toHhMmString } from '@/plugins/date'
import { CountType, getCount } from '@/plugins/metrics'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  icon: string
  variant: 'user' | 'device' | 'alarm'
  addOnline?: boolean
  userID?: string
  deviceID?: string
}>()

const { tenant } = storeToRefs(useUserStore())

const alert = ref<Alert>({ on: false })
const labels = ref<Array<string>>([])
const totalCountValues = ref<Array<number>>([])
const totalCount = ref<number>(0)
const onlineCount = ref<number>(0)
const onlineCountValues = ref<Array<number>>([])

const title = computed(() => {
  switch (props.variant) {
    case 'user':
      return 'Users'
    case 'device':
      return 'Devices'
    case 'alarm':
      return 'Alarms'
  }
})

function getCountType(online?: boolean): CountType {
  switch (props.variant) {
    case 'user':
      return online ? CountType.OnlineUser : CountType.User
    case 'device':
      return online ? CountType.OnlineDevice : CountType.Device
    case 'alarm':
      return CountType.Alarm
  }
}

async function loadInstantCount(namespace: string, online?: boolean) {
  const ret = await getCount({
    namespace: namespace,
    countType: getCountType(online),
    userID: props.userID,
    deviceID: props.deviceID,
  })
  console.log('current count', ret)
  if (!ret) {
    return
  }
  if (ret.alert) {
    alert.value = ret.alert
    return
  }
  if (ret.count != undefined) {
    online ? (onlineCount.value = ret.count) : (totalCount.value = ret.count)
  }
}

async function loadRangeCount(namespace: string, online?: boolean) {
  const now = Math.floor(Date.now() / 1000 / 300) * 300
  const start = now - 3600 // 1 hour
  const ret = await getCount({
    namespace: namespace,
    countType: getCountType(online),
    userID: props.userID,
    deviceID: props.deviceID,
    start: start,
    end: now,
    step: '5m',
  })
  console.log('load count:', ret)
  if (!ret) {
    return
  }
  if (ret.alert) {
    alert.value = ret.alert
    return
  }
  if (ret.values) {
    const values = ret.values.map((v) => v[1])
    online
      ? (onlineCountValues.value = values as number[])
      : (totalCountValues.value = values as number[])
    if (!online) {
      labels.value = ret.values.map((v) => {
        const time = v[0] ?? 0
        const date = new Date(time * 1000)
        return toHhMmString(date)
      })
    }
  }
}

async function loadCount() {
  const t = tenant.value
  if (!t || !t.namespace) {
    return
  }

  await loadInstantCount(t.namespace)
  await loadRangeCount(t.namespace)
  if (props.addOnline) {
    await loadInstantCount(t.namespace, true)
    await loadRangeCount(t.namespace, true)
  }
}
</script>
<template>
  <Alert v-model="alert"></Alert>
  <LineChartCard
    :icon="icon"
    :labels="labels"
    :values="[totalCountValues, onlineCountValues]"
    @load="loadCount"
    ><template v-slot:title
      ><v-row justify="center"
        ><v-chip size="x-large" variant="text">{{ title }}</v-chip
        ><v-chip v-if="addOnline" color="green" size="x-large" variant="text"
          >Online: {{ onlineCount }}</v-chip
        >
        <v-chip size="x-large" variant="text"
          >Total: {{ totalCount }}</v-chip
        ></v-row
      >
    </template></LineChartCard
  >
</template>
