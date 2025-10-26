<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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

const props = defineProps<{
  namespace: string
  instances: Array<PopInstance>
}>()
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

onMounted(() => {
  loadSystemPops()
})

const addPopDialog = ref(false)
const addPops = ref<Array<string>>([])
const addRouteDialog = ref(false)
const addRoutePop = ref<PopInstance>()
const allPops = ref<Array<string>>([])
const itemsPerPage = ref(10)
const loading = ref(false)
const note = ref('')
const search = ref('')

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

async function loadSystemPops() {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supPopAPI().getPopList()
    allPops.value = ret?.data.popList?.map((p) => p.name) ?? []
    console.log('instances:', ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading pop instances.')
  loading.value = false
}

function refresh() {
  loadSystemPops()
  emit('refresh')
}

function canAddPop(current: Array<PopInstance>): boolean {
  const existing = current.map((p) => p.name)
  const toAdd = allPops.value.filter((p) => !existing.some((e) => e == p))
  return toAdd.length > 0
}

function addPop() {
  addPopDialog.value = true
  const existing = props.instances.map((p) => p.name)
  addPops.value = allPops.value.filter((p) => !existing.some((e) => e == p))
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
  })
  if (ret) {
    console.log('ret=', ret)
    alert.value = ret
  }
  loading.value = false
}
</script>
<template>
  <v-container fluid>
    <v-row class="ma-2">
      <v-chip size="large">Pop Instances of {{ namespace }}</v-chip>
      <v-spacer></v-spacer>
      <AddButton v-if="canAddPop(instances)" @click="addPop"></AddButton>
      <RefreshButton @refresh="refresh" />
    </v-row>
    <v-row>
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
            <v-row align="center">
              <v-col col="9">
                <PopRouteChip
                  v-for="n in item.routes"
                  :route="n"
                  @delete="deleteRoute(item, n)"
                >
                </PopRouteChip>
              </v-col>
              <v-col col="3">
                <AddButton
                  label="Add a route to this pop"
                  @click="addRoute(item)"
                ></AddButton>
              </v-col>
            </v-row>
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
      :namespace="namespace"
      :add-pops="addPops"
    >
    </AddSupervisorPopToNamespaceDialog>
    <AddPopRouteDialog
      v-model="addRouteDialog"
      :namespace="namespace"
      :pop="addRoutePop"
      :all-pops="allPops"
    >
    </AddPopRouteDialog>
  </v-container>
</template>
