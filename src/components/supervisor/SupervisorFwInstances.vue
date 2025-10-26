<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import {
  Status,
  FwInstance,
  FwNamespaceResource as FwResource,
  FwConfig,
  PopInstance,
} from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supFwAPI, supResourceAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  namespace: string
  instances: Array<FwInstance>
  pops: Array<PopInstance>
}>()

const emit = defineEmits(['refresh'])
const alert = defineModel<Alert>('alert')

const headers = ref([
  { title: 'ID', key: 'id' },
  { title: 'Name', key: 'name' },
  { title: 'Pop', key: 'pop' },
  { title: 'Connection', key: 'rest' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

onMounted(() => {
  loadSystemFws()
  loadFwResources()
  emit('refresh')
})

const addFwDialog = ref(false)
const addFws = ref<Array<FwConfig>>([])
const allFws = ref<Array<FwConfig>>([])
const allFwResources = ref<Array<FwResource>>([])
const itemsPerPage = ref(10)
const loading = ref(false)
const search = ref('')

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

async function loadSystemFws() {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supFwAPI().getFwList()
    allFws.value = ret?.data.fws ?? []
    console.log('fw configs:', ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading fw configs.')
  loading.value = false
}

async function loadFwResources() {
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supResourceAPI().getNamespaceResources(props.namespace)
    allFwResources.value = ret?.data.fwResources ?? []
    console.log('fw resources:', ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading fw resources.')
  loading.value = false
}

function refresh() {
  loadSystemFws()
  loadFwResources()
  emit('refresh')
}
function canAddFw(current: Array<FwInstance>): boolean {
  const existing = current.map((n) => n.name)
  const toAdd = allFws.value.filter((n) => !existing.some((e) => e == n.name))
  return toAdd.length > 0
}

function addFw() {
  addFwDialog.value = true
  const existing = props.instances.map((n) => n.name)
  addFws.value = allFws.value.filter((n) => !existing.some((e) => e == n.name))
}

async function deleteItem(item: FwInstance) {
  const namespace = props.namespace
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }
  const instanceID = item.id
  if (!instanceID) {
    alert.value = {
      on: true,
      text: `Invalid firewall instance ID for "${item.name}".`,
    }
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    await supFwAPI().deleteFw(instanceID)
    emit('refresh')
    newToast({
      on: true,
      color: 'green',
      text: `Removed firewall instance ${item.name} from ${namespace}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log(`Done deleting firewall instance ${item.name} from ${namespace}.`)
  loading.value = false
}

function confirmDeleteText(item: FwInstance): string {
  const namespace = props.namespace
  return `Delete firewall "${item.name}" with ID "${item.id}" in ${namespace}?`
}
</script>
<template>
  <v-container fluid>
    <v-row align="center" class="mx-2 my-2">
      <v-chip size="large">Firewall Instances of {{ namespace }}</v-chip>
      <v-spacer></v-spacer>
      <AddButton v-if="canAddFw(instances)" @click="addFw"></AddButton>
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
      <template v-slot:item.actions="{ item }">
        <DeleteButton
          :confirmDeleteText="confirmDeleteText(item)"
          @delete="deleteItem(item)"
        >
        </DeleteButton>
      </template>
    </v-data-table>
    <v-row align="center" class="mx-2 my-2">
      <v-chip size="large">Firewall Resources of {{ namespace }}</v-chip>
      <v-spacer></v-spacer>
      <RefreshButton @refresh="loadFwResources" />
    </v-row>
    <v-data-table
      v-model:items-per-page="itemsPerPage"
      class="mt-2"
      :items="allFwResources"
      :items-length="allFwResources.length"
      :loading="loading"
      :search="search"
    >
    </v-data-table>
    <AddFirewallToNamespaceDialog
      v-model="addFwDialog"
      :namespace="namespace"
      :add-pops="pops"
      :add-fws="addFws"
    >
    </AddFirewallToNamespaceDialog>
  </v-container>
</template>
