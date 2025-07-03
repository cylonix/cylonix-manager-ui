<script setup lang="ts">
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'

import { onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from './stores/user'

use([
  CanvasRenderer,
  GridComponent,
  LegendComponent,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
])

const drawer = ref(false)
const route = useRoute()
const router = useRouter()
const store = useUserStore()
const { loggedIn } = storeToRefs(store)

watch(loggedIn, (newValue) => {
  if (!newValue && route.meta && route.meta.requiresAuth) {
    console.log(
      `User not logged in, redirecting to login page from ${route.path}`
    )
    router.push('/login')
  }
})
onMounted(() => {
  store.$checkExpiration()
})
</script>

<template>
  <v-layout class="rounded rounded-md">
    <AppBar title="Cylonix Manager" v-model:drawer="drawer" />
    <MainDrawer v-model:drawer="drawer" />
    <v-main
      class="d-flex align-center justify-center"
      style="min-height: 300px"
    >
      <router-view />
    </v-main>
  </v-layout>
</template>
