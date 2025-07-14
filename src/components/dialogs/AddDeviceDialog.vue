<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { VForm } from 'vuetify/components'
import { Device, DeviceType } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { deviceAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const dialog = defineModel<boolean>()
const emit = defineEmits(['added'])

const alert = ref<Alert>({ on: false })
const deviceType = ref<DeviceType>(DeviceType.Other)
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const name = ref('')

const ready = computed(() => {
  return isFormValid.value
})

onMounted(async () => {
  //
})

async function add() {
  const ret = await tryRequest(async () => {
    loading.value = true
    await deviceAPI.postDevice(<Device>{
      id: '' /* assign by backend */,
      type: deviceType.value,
      name: name.value,
    })
    emit('added')
    newToast({
      on: true,
      color: 'green',
      text: `Added device ${name.value} successfully.`,
    })
    dialog.value = false
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
    minWidth="400"
    :okDisabled="!ready"
    okText="Add"
    title="Add device"
    @ok="add"
    ><template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="add-device">
        <NameInput v-model="name" label="Device name"></NameInput>
        <v-chip-group selected-class="text-primary" column mandatory>
          <v-chip v-for="tag in DeviceType" :key="tag" :text="tag"></v-chip>
        </v-chip-group>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
