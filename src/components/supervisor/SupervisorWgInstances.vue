<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { Status, WgInstance, WgNamespace } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supWgAPI, tryRequest } from '@/plugins/api'
import { useUserStore } from '@/stores/user'

defineProps<{
  namespace: string
  instances: Array<WgNamespace>
}>()

const emit = defineEmits(['refresh'])
const alert = defineModel<Alert>('alert')

const headers = ref([
  { title: 'Endpoint', key: 'rest' },
  { title: 'Name', key: 'name' },
  { title: 'Pop', key: 'pop' },
  { title: 'Port', key: 'port' },
  { title: 'Status', key: 'status' },
  { title: 'IP', key: 'ip' },
  { title: 'Public Key', key: 'publicKey' },
] as const)

onMounted(() => {
  loadSystemWgs()
})

const allWgs = ref<Array<WgInstance>>([])
const itemsPerPage = ref(10)
const loading = ref(false)
const search = ref('')

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

async function loadSystemWgs() {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supWgAPI().getWgInstanceList()
    allWgs.value = ret?.data.wgInstances ?? []
    console.log('instances:', ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading wg instances.')
  loading.value = false
}

function refresh() {
  loadSystemWgs()
  emit('refresh')
}
</script>
<template>
  <v-container fluid>
    <v-row align="center" class="mx-2 my-2">
      <v-chip size="large">WireGuard Instances of {{ namespace }}</v-chip>
      <v-spacer></v-spacer>
      <RefreshButton @refresh="refresh" />
    </v-row>
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="headers"
      :hide-default-footer="instances.length <= itemsPerPage"
      :items="instances"
      :items-length="instances.length"
      :loading="loading"
      :search="search"
    >
      <template v-slot:item.status="{ item }">
        <v-chip :color="item.status == Status.Online ? 'green' : 'grey'">
          {{ item.status ?? 'Offline' }}
        </v-chip>
      </template>
    </v-data-table>
  </v-container>
</template>
