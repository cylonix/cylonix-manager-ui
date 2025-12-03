<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { NamespaceInstances } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supInstanceAPI, supPopAPI, tenantAPI, tryRequest } from '@/plugins/api'
import { useUserStore } from '@/stores/user'

onMounted(() => {
  loadSystemPops()
  loadItems(undefined)
  loadTenants()
})

const alert = ref<Alert>({ on: false })
const loading = ref(false)
const loadOptions = ref()
const instances = ref<NamespaceInstances[]>()

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)

async function loadItems(options: any) {
  loadOptions.value = options
  if (!isSysAdmin.value) {
    alert.value = {
      on: true,
      text: 'Operation is only allowed for system administrators.',
    }
    return
  }

  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await supInstanceAPI().getInstances()
    const data = ret?.data
    if (data && typeof data === 'string') {
      const v = data as string
      const preview = v.substring(0, 80) + (v.length > 80 ? '...' : '')
      throw new Error(
        `Server returned invalid format - expected JSON. Got: ${preview}`
      )
    }
    instances.value =
      ret?.data?.filter((item) => {
        // Filter out undefined namespaces and those with invalid format
        if (!item?.namespace) return false
        if (item.namespace.length > 80) return false
        if (item.namespace.includes(' ')) return false
        return true
      }) ?? []
    console.log('instances:', ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading instances.')
  loading.value = false
}

function refresh() {
  loadItems(loadOptions.value)
  loadSystemPops()
  loadTenants()
}

const addNamespaceDialog = ref(false)
const allNamespaces = ref<Array<string>>([])
const allPops = ref<Array<string>>([])
async function addNamespaceClicked() {
  addNamespaceDialog.value = true
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
    console.log('system pops:', ret?.data)
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done loading system pops.')
  loading.value = false
}

async function loadTenants() {
  console.log('Loading tenants...')
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await tenantAPI.listTenantConfig([])
    allNamespaces.value = ret?.data.items?.map((t) => t.namespace) ?? []
    console.log('tenants:', ret?.data)
    console.log('allNamespaces:', allNamespaces.value)
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

const namespacesToAdd = computed(() => {
  const existing = instances.value?.map((n) => n.namespace) ?? []
  const toAdd = allNamespaces.value.filter((n) => !existing.some((e) => e == n))
  console.log(
    'namespacesToAdd:',
    toAdd,
    'existing:',
    existing,
    'allNamespaces:',
    allNamespaces.value
  )
  return toAdd
})
</script>
<template>
  <v-container fluid>
    <v-row fluid>
      <v-col col="12"> <Alert v-model="alert" fluid></Alert> </v-col>
    </v-row>
    <v-row class="ma-2" fluid justify="space-between" align="center">
      <v-chip variant="text" size="x-large">Gateway Instances</v-chip>
      <AddButton
        v-if="isSysAdmin"
        label="Add gateway to namespace"
        @click="addNamespaceClicked"
      ></AddButton>
    </v-row>
    <v-row class="ma-2 w-100" v-for="i in instances" fluid>
      <v-col>
        <v-divider></v-divider>
        <v-row class="ma-2" fluid justify="space-between" align="center">
          <v-chip variant="text" size="x-large">{{ i.namespace }}</v-chip>
        </v-row>
        <v-row fluid>
          <v-col cols="12">
            <SupervisorPopInstances
              :namespace="i.namespace"
              :all-pops="allPops"
              :instances="i.instances?.popInstance ?? []"
              v-model:alert="alert"
              @refresh="refresh"
            ></SupervisorPopInstances>
            <SupervisorWgInstances
              v-if="i.namespace && i.instances?.wgInstance"
              :namespace="i.namespace"
              :instances="i.instances?.wgInstance ?? []"
              v-model:alert="alert"
              @refresh="refresh"
            ></SupervisorWgInstances>
            <SupervisorFwInstances
              v-if="i.namespace && i.instances?.fwInstance"
              :namespace="i.namespace"
              :instances="i.instances?.fwInstance ?? []"
              :pops="i.instances?.popInstance ?? []"
              v-model:alert="alert"
              @refresh="refresh"
            ></SupervisorFwInstances>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
  <AddSupervisorPopToNamespaceDialog
    v-model="addNamespaceDialog"
    for-namespace=""
    :namespaces="namespacesToAdd"
    :add-pops="allPops"
  >
  </AddSupervisorPopToNamespaceDialog>
</template>
