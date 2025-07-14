<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { PopConfigInput } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supPopAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const bandwidth = ref(20)
const city = ref('')
const cloud = ref('')
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const latitude = ref(0)
const longitude = ref(0)
const loading = ref(false)
const name = ref('')
const net = ref(0)
const underlay = ref('')

const ready = computed(() => {
  return isFormValid.value
})

/*
{
  "name":"pop-bj-18",
  "grpc_endpoint":"tcp://100.64.1.52:9111",
  "restapi":"",
  "city":"beijing-18",
  "bandwidth":20,
  "latitude":321.0,
  "longtitude":40.3,
  "wan_addr":"172.32.18.9",
  "underlay_addr":"172.32.18.10",
  "default_gw":"172.32.18.1",
  "management_intf_addr":"172.32.18.1",
  "prefix_len":24,
  "public_cloud":"Azure-Beijing",
  "intf_type":"veth"
}
*/
async function add() {
  const ret = await tryRequest(async () => {
    loading.value = true
    const input = <PopConfigInput>{
      name: name.value,
      grpcEndpoint: `tcp://${underlay.value}:9111`,
      city: city.value,
      bandwidth: bandwidth.value,
      latitude: latitude.value,
      longtitude: longitude.value,
      wanAddr: `172.32.${net.value}.9`,
      underlayAddr: `172.32.${net.value}.10`,
      defaultGw: `172.32.${net.value}.1`,
      managementIntfAddr: `172.32.${net.value}.1`,
      prefixLen: 24,
      publicCloud: cloud.value,
      intfType: 'veth',
    }
    await supPopAPI().createPop(input)
    newToast({
      on: true,
      color: 'green',
      text: `Added pop ${name.value} successfully`,
    })
    // Remove dialog after success.
    console.log('pop config:', input)
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
    title="Add pop"
    @ok="add"
    ><template v-slot:item>
      <Alert v-if="alert.on" :alert="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <v-row>
          <v-col sm="12" lg="6">
            <NameInput v-model="name" label="Pop name"></NameInput>
            <NameInput
              v-model="underlay"
              label="Pop mesh underlay address"
            ></NameInput>
            <v-number-input
              control-variant="stacked"
              v-model="bandwidth"
              label="Bandwidth"
              inset
            ></v-number-input>
            <v-number-input
              v-model="net"
              label="Subnet assigned"
              control-variant="stacked"
              inset
            ></v-number-input>
          </v-col>
          <v-col sm="12" lg="6">
            <NameInput v-model="cloud" label="Cloud provider"></NameInput>
            <NameInput v-model="city" label="Location city"></NameInput>
            <v-number-input
              v-model="latitude"
              label="Location latitude"
              control-variant="stacked"
              inset
            ></v-number-input>
            <v-number-input
              v-model="longitude"
              label="Location longitude"
              control-variant="stacked"
              inset
            ></v-number-input>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
