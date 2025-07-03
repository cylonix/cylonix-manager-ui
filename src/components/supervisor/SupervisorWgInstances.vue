<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Status,
  WgInstance,
  WgNamespace,
  WgNamespaceResource
} from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supResourceAPI, supWgAPI, tryRequest } from '@/plugins/api'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  namespace: string
  instances: Array<WgNamespace>
}>()

const emit = defineEmits(['refresh'])
const alert = defineModel<Alert>('alert')

const headers = ref([
  { title: 'ID', key: 'rest' },
  { title: 'Name', key: 'name' },
  { title: 'Pop', key: 'pop' },
  { title: 'Port', key: 'port' },
  { title: 'Status', key: 'status' },
  { title: 'IP', key: 'ip' }
] as const)

const resourceHeaders = ref([
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Status', key: 'status' },
  { title: 'Details', key: 'namespace' }
] as const)

onMounted(() => {
  loadSystemWgs()
  loadWgResources()
})

const allWgs = ref<Array<WgInstance>>([])
const wgResources = ref<Array<WgNamespaceResource>>([])
const itemsPerPage = ref(10)
const loading = ref(false)
const search = ref('')

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

async function loadSystemWgs() {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.'
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

async function loadWgResources() {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.'
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supResourceAPI().getNamespaceResources(props.namespace)
    wgResources.value = ret?.data.wgResources ?? []
    console.log(`${props.namespace} wg resources:`, wgResources.value)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading wg resources.')
  loading.value = false
}

function refresh() {
  loadSystemWgs()
  loadWgResources()
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
    <v-row align="center" class="mx-2 my-2">
      <v-chip size="large">WireGuard resources of {{ namespace }}</v-chip>
      <v-spacer></v-spacer>
      <RefreshButton @refresh="refresh" />
    </v-row>
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :headers="resourceHeaders"
      :items="wgResources"
      :items-length="wgResources.length"
      :loading="loading"
      :search="search"
    >
      <template v-slot:item.status="{ item }">
        <v-chip :color="item.active ? 'green' : 'grey'">
          {{ item.active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>
    </v-data-table>
  </v-container>
</template>
