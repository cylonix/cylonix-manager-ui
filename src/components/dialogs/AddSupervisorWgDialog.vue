<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { WgInstanceInput } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supWgAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const ip = ref('')
const loading = ref(false)
const name = ref('')
const net = ref(0)
const pop = ref('')
const underlay = ref('')

const ready = computed(() => {
  return isFormValid.value
})

/*'{
    "access_points":["143.64.152.103"],
    "conn":"http://100.64.1.52:8080",
    "name":"wg-bj-18",
    "pop":"pop-bj-18",
    "lan_addr":"172.32.18.1",
    "default_gateway":"172.32.18.1",
    "default_interface":"br7",
    "host_name":"pop-bj-18"
}'*/

async function add() {
  const ret = await tryRequest(async () => {
    loading.value = true
    const input = <WgInstanceInput>{
      accessPoints: [ip.value],
      name: name.value,
      pop: pop.value,
      conn: `http://${underlay.value}:8080`,
      lanAddr: `172.32.${net.value}.1`,
      defaultGateway: `172.32.${net.value}.1`,
      defaultInterface: 'br7',
      hostName: pop.value,
    }
    await supWgAPI().createWgInstance(input)
    newToast({
      on: true,
      color: 'green',
      text: `Added WireGuard gateway ${name.value} successfully.`,
    })
    // Remove dialog after success.
    console.log('wg instance:', input)
    dialog.value = false
    emit('added')
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>

<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    maxWidth="1000"
    :minWidth="lgAndUp ? '900' : '400'"
    :okDisabled="!ready"
    okText="Add"
    title="Add WireGuard Gateway"
    @ok="add"
    ><template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <v-row>
          <v-col sm="12" lg="6">
            <NameInput
              v-model="name"
              label="WireGuard gateway name"
            ></NameInput>
            <NameInput
              v-model="underlay"
              label="Gateway mesh underlay address"
            ></NameInput>
            <v-number-input
              v-model="net"
              label="Subnet assigned"
              control-variant="stacked"
              inset
            ></v-number-input>
          </v-col>
          <v-col sm="12" lg="6">
            <NameInput v-model="pop" label="Pop name"></NameInput>
            <NameInput v-model="ip" label="IP address"></NameInput>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
