<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { NamespaceInstances } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supInstanceAPI, tryRequest } from '@/plugins/api'
import { useUserStore } from '@/stores/user'

onMounted(() => {
  loadItems(undefined)
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
    instances.value = ret?.data
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
}
</script>
<template>
  <v-container fluid>
    <v-row
      ><v-col col="12"> <Alert v-model="alert" fluid></Alert> </v-col
    ></v-row>
    <v-row v-for="i in instances" fluid class="fill-height">
      <v-col :col="12">
        <SupervisorPopInstances
          :namespace="i.namespace"
          :instances="i.instances?.popInstance ?? []"
          v-model:alert="alert"
          @refresh="refresh"
        ></SupervisorPopInstances>
      </v-col>
    </v-row>
    <v-row v-for="i in instances" fluid>
      <v-col :col="12">
        <SupervisorWgInstances
          :namespace="i.namespace"
          :instances="i.instances?.wgInstance ?? []"
          v-model:alert="alert"
          @refresh="refresh"
        ></SupervisorWgInstances>
      </v-col>
    </v-row>
    <v-row v-for="i in instances" fluid>
      <v-col :col="12">
        <SupervisorFwInstances
          :namespace="i.namespace"
          :instances="i.instances?.fwInstance ?? []"
          :pops="i.instances?.popInstance ?? []"
          v-model:alert="alert"
          @refresh="refresh"
        ></SupervisorFwInstances>
      </v-col>
    </v-row>
  </v-container>
</template>
