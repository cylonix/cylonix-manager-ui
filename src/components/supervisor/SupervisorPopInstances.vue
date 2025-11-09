<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  IPRoute,
  IPRouteDeleteInput,
  PopApplyInput,
  PopInstance,
  Status,
} from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supPopAPI, supRouteAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const props = defineProps({
  namespace: {
    type: String,
    required: true,
  },
  instances: {
    type: Array<PopInstance>,
    default: []
  },
  allPops: {
    type: Array<string>,
    default: []
  }
})
const emit = defineEmits(['refresh'])
const alert = defineModel<Alert>('alert')

const headers = ref([
  { title: 'ID', key: 'id', align: 'center' },
  { title: 'Name', key: 'name' },
  { title: 'VRF', key: 'vrf' },
  { title: 'BVI', key: 'bvi' },
  { title: 'Routes', key: 'routes' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Tunnels', key: 'tunnels' },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

const addPopDialog = ref(false)
const addPops = ref<Array<string>>([])
const addRouteDialog = ref(false)
const addRoutePop = ref<PopInstance>()
const itemsPerPage = ref(10)
const loading = ref(false)
const note = ref('')
const search = ref('')
const showDeviceHostRoutes = ref<Record<string, boolean>>({})

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

async function deleteItem(item: PopInstance) {
  const namespace = props.namespace
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    await supPopAPI().popRemoveFromUser(namespace, <PopApplyInput>{
      pops: [item.name],
    })
    // TODO: make loading pop instances API base on namespace and pop only.
    emit('refresh')
    newToast({
      on: true,
      color: 'green',
      text: `Removed pop instance ${item.name} from ${namespace}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log(`Done deleting pop instance ${item.name} from ${namespace}.`)
  loading.value = false
}

function confirmDeleteText(item: PopInstance): string {
  const namespace = props.namespace
  return `Delete pop "${item.name}" with ID "${item.id}" in ${namespace}?`
}

function refresh() {
  emit('refresh')
}

function canAddPop(current: Array<PopInstance>): boolean {
  const existing = current.map((p) => p.name)
  const toAdd = props.allPops.filter((p) => !existing.some((e) => e == p))
  return toAdd.length > 0
}

function addPop() {
  addPopDialog.value = true
  const existing = props.instances.map((p) => p.name)
  addPops.value = props.allPops.filter((p) => !existing.some((e) => e == p))
}

function addRoute(item: PopInstance) {
  addRoutePop.value = item
  addRouteDialog.value = true
}
async function deleteRoute(pop: PopInstance, item: IPRoute) {
  const popID = pop.id
  if (!popID) {
    alert.value = <Alert>{
      on: true,
      text: 'pop is not set',
    }
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await supRouteAPI().deleteNamespaceRoute(props.namespace, popID, <
      IPRouteDeleteInput
    >{
      ids: [item.id ?? ''],
    })
    newToast({
      on: true,
      color: 'green',
      text: `Deleted route ${item.dest} -> ${item.via} successfully.`,
    })
    refresh()
  })
  if (ret) {
    console.log('ret=', ret)
    alert.value = ret
  }
  loading.value = false
}

function nonDeviceHostRoutes(pop: PopInstance): Array<IPRoute> {
  return (pop.routes ?? []).filter((r) => {
    return !r.dest?.startsWith("100") || !r.dest?.endsWith("/32")
  })
}

function deviceHostRoutes(pop: PopInstance): Array<IPRoute> {
  return (pop.routes ?? []).filter((r) => {
    return r.dest?.startsWith("100") && r.dest?.endsWith("/32")
  })
}

function toggleDeviceHostRoutes(item: PopInstance) {
  const itemId = item.id ?? item.name
  showDeviceHostRoutes.value[itemId] = !showDeviceHostRoutes.value[itemId]
}

function isDeviceHostRoutesVisible(item: PopInstance): boolean {
  const itemId = item.id ?? item.name
  return showDeviceHostRoutes.value[itemId] ?? false
}
</script>
<template>
  <v-container fluid>
    <v-row class="ma-2" fluid>
      <v-chip size="large">Pop Instances of {{ namespace }}</v-chip>
      <v-spacer></v-spacer>
      <AddButton v-if="canAddPop(instances)" @click="addPop"></AddButton>
      <RefreshButton @refresh="refresh" />
    </v-row>
    <v-row fluid>
      <v-col col="12">
        <v-data-table
          v-model:items-per-page="itemsPerPage"
          :items="instances"
          :items-length="instances.length"
          :headers="headers"
          :hide-default-footer="instances.length <= itemsPerPage"
          :loading="loading"
          :search="search"
        >
          <template v-slot:item.id="{ item }">
            <ShortenTextChip :text="item.id"></ShortenTextChip>
          </template>

          <template v-slot:item.status="{ item }">
            <v-chip :color="item.status == Status.Online ? 'green' : 'grey'">
              {{ item.status ?? 'Offline' }}
            </v-chip>
          </template>

          <template v-slot:item.bvi="{ item }">
            <PopBVIChip
              class="mx-1 my-1"
              v-for="n in item.bvis"
              :bvi="n"
            ></PopBVIChip>
          </template>

          <template v-slot:item.routes="{ item }">
            <!-- Non-device host routes -->
            <PopRouteChip
              v-for="n in nonDeviceHostRoutes(item)"
              :route="n"
              @delete="deleteRoute(item, n)"
            >
            </PopRouteChip>

            <!-- Toggle button for device host routes -->
            <v-btn
              v-if="deviceHostRoutes(item).length > 0"
              class="mx-2"
              size="small"
              variant="outlined"
              @click="toggleDeviceHostRoutes(item)"
            >
              {{ isDeviceHostRoutesVisible(item) ? 'Hide' : '' }} Device Routes
              ({{ deviceHostRoutes(item).length }})
            </v-btn>

            <!-- Device host routes (shown when toggled) -->
            <PopRouteChip
              v-if="isDeviceHostRoutesVisible(item)"
              v-for="n in deviceHostRoutes(item)"
              :route="n"
              @delete="deleteRoute(item, n)"
            >
            </PopRouteChip>
            <AddButton
              label="Add a route to this pop"
              @click="addRoute(item)"
            ></AddButton>
          </template>

          <template v-slot:item.tunnels="{ item }">
            <PopTunnelChip v-for="n in item.tunnels" :tunnel="n">
            </PopTunnelChip>
          </template>

          <template v-slot:item.actions="{ item }">
            <DeleteButton
              v-model:note="note"
              :confirmDeleteText="confirmDeleteText(item)"
              @delete="deleteItem(item)"
            >
            </DeleteButton>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <AddSupervisorPopToNamespaceDialog
      v-model="addPopDialog"
      :for-namespace="namespace"
      :add-pops="addPops"
      @added="refresh"
    >
    </AddSupervisorPopToNamespaceDialog>
    <AddPopRouteDialog
      v-model="addRouteDialog"
      :namespace="namespace"
      :pop="addRoutePop"
      :all-pops="instances"
      @added="refresh"
    >
    </AddPopRouteDialog>
  </v-container>
</template>
