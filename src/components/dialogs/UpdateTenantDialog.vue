<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { VForm } from 'vuetify/components'
import { TenantConfig } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tenantAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const emit = defineEmits(['updated'])
const props = defineProps<{ tenant?: TenantConfig }>()
const dialog = defineModel<boolean>()

const alert = ref<Alert>({ on: false })
const changed = ref()
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const name = ref()
const email = ref()
const phone = ref()
const maxUserCount = ref()
const maxDeviceCount = ref()
const maxDevicePerUser = ref()

const ready = computed(() => {
  const t = props.tenant
  const same =
    name.value == t?.name &&
    email.value == t?.email &&
    phone.value == t?.phone &&
    maxUserCount.value == t?.maxUserCount &&
    maxDeviceCount.value == t?.maxDeviceCount &&
    maxDevicePerUser.value == t?.maxDevicePerUser
  return props.tenant && isFormValid.value && changed.value && !same
})

const text = computed(() => {
  return `Update tenant "${props.tenant?.name}"`
})

// Update initial values when prop changes.
watchEffect(() => {
  const t = props.tenant
  name.value = t?.name
  email.value = t?.email
  phone.value = t?.phone
  maxUserCount.value = t?.maxUserCount
  maxDeviceCount.value = t?.maxDeviceCount
  maxDevicePerUser.value = t?.maxDevicePerUser
})

function change() {
  changed.value = true
}

async function updateTenant() {
  const { valid } = await form.value!.validate()
  if (!valid) {
    return
  }
  const ret = await tryRequest(async () => {
    const t = props.tenant
    if (!t) {
      return
    }
    loading.value = true
    await tenantAPI.updateTenantConfig({
      id: t.id,
      name: name.value,
      namespace: t.namespace,
      email: email.value,
      phone: phone.value,
      maxUserCount: Number(maxUserCount.value),
      maxDeviceCount: Number(maxDeviceCount.value),
      maxDevicePerUser: Number(maxDevicePerUser.value),
      autoAcceptRoutes: t.autoAcceptRoutes,
      autoApproveDevice: t.autoApproveDevice,
      welcomeEmailSent: t.welcomeEmailSent,
    })
    newToast({
      on: true,
      color: 'green',
      text: 'Tenant config update success.',
    })
    emit('updated')
    dialog.value = false
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done updating tenant config.')
  loading.value = false
}
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    max-width="600"
    min-width="400"
    :okDisabled="!ready"
    okText="Submit"
    :text="text"
    title="Edit"
    @ok="updateTenant"
  >
    <template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form class="mt-2" ref="form" v-model="isFormValid" auto-complete="on">
        <EmailInput class="mt-2" v-model="email" @change="change"></EmailInput>
        <PhoneInput class="mt-2" v-model="phone" @change="change"></PhoneInput>
        <v-text-field

          v-model="maxUserCount"
          label="Max User Count"
          type="number"
          min="0"
          @change="change"
        ></v-text-field>
        <v-text-field
          class="mt-2"
          v-model="maxDeviceCount"
          label="Max Device Count"
          type="number"
          min="0"
          @change="change"
        ></v-text-field>
        <v-text-field
          class="mt-2"
          v-model="maxDevicePerUser"
          label="Max Device Per User"
          type="number"
          min="0"
          @change="change"
        ></v-text-field>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
