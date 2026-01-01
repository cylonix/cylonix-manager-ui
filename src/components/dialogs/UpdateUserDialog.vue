<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { VForm } from 'vuetify/components'
import { MeshVpnMode, User, UserUpdateInfo } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import MeshVpnModeSelect from '../selects/MeshVpnModeSelect.vue'

const emit = defineEmits(['updated'])
const props = defineProps<{ user?: User }>()
const dialog = defineModel<boolean>()

const alert = ref<Alert>({ on: false })
const changed = ref()
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(true)
const loading = ref(false)
const displayName = ref()
const email = ref()
const phone = ref()
const vpnMode = ref<MeshVpnMode>(
  props.user?.networkSetting?.meshVpnMode ?? MeshVpnMode.Tenant
)
const autoApproveDevice = ref(props.user?.autoApproveDevice ?? false)
const gatewayEnabled = ref(props.user?.networkSetting?.gatewayEnabled ?? false)

const ready = computed(() => {
  const t = props.user
  const same =
    displayName.value == t?.displayName &&
    email.value == t?.email &&
    phone.value == t?.phone &&
    vpnMode.value == t?.networkSetting?.meshVpnMode &&
    autoApproveDevice.value == t?.autoApproveDevice &&
    gatewayEnabled.value == t?.networkSetting?.gatewayEnabled
  return t && (isFormValid.value !== false) && !same
})

const text = computed(() => {
  return `Update user "${props.user?.displayName}"`
})

// Update initial values when prop changes.
watchEffect(() => {
  const t = props.user
  displayName.value = t?.displayName
  email.value = t?.email
  phone.value = t?.phone
  vpnMode.value = t?.networkSetting?.meshVpnMode ?? MeshVpnMode.Tenant
  autoApproveDevice.value = t?.autoApproveDevice ?? false
  gatewayEnabled.value = t?.networkSetting?.gatewayEnabled ?? false
})

function change() {
  changed.value = true
}

async function update() {
  const { valid } = await form.value!.validate()
  if (!valid) {
    return
  }

  const ret = await tryRequest(async () => {
    const t = props.user
    if (!t) {
      return
    }
    loading.value = true
    await userAPI.updateUser(t.userID, t.namespace, <UserUpdateInfo>{
      addEmail: t.email != email.value ? email.value : undefined,
      addPhone: t.phone != phone.value && phone.value ? phone.value : undefined,
      delPhone: t.phone != phone.value && !phone.value ? t.phone : undefined,
      displayName:
        t.displayName != displayName.value ? displayName.value : undefined,
      setDisplayName: t.displayName != displayName.value,
      gatewayEnabled:
        t.networkSetting?.gatewayEnabled != gatewayEnabled.value
          ? gatewayEnabled.value
          : undefined,
      autoApproveDevice:
        t.autoApproveDevice != autoApproveDevice.value
          ? autoApproveDevice.value
          : undefined,
      meshVpnMode:
        t.networkSetting?.meshVpnMode != vpnMode.value
          ? vpnMode.value
          : undefined,
    })
    newToast({
      on: true,
      color: 'green',
      text: 'User update success.',
    })
    emit('updated')
    dialog.value = false
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done updating user.')
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
    title="Update"
    @ok="update"
  >
    <template class="mt-2" v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form class="mt-2" ref="form" v-model="isFormValid" auto-complete="on">
        <NameInput
          class="mt-2"
          v-model="displayName"
          label="Display name"
          max="64"
          @change="change"
        ></NameInput>
        <EmailInput class="mt-2" v-model="email" @change="change"></EmailInput>
        <PhoneInput class="mt-2" v-model="phone" @change="change"></PhoneInput>
        <v-chip
          class="ma-2"
          :color="gatewayEnabled ? 'green' : 'grey'"
          @click="gatewayEnabled = !gatewayEnabled"
        >
          <v-icon
            start
            :icon="gatewayEnabled ? 'mdi-check' : 'mdi-close'"
          ></v-icon>
          Gateway Enabled
        </v-chip>
        <v-chip
          class="ma-2"
          :color="autoApproveDevice ? 'green' : 'grey'"
          @click="autoApproveDevice = !autoApproveDevice"
        >
          <v-icon
            start
            :icon="autoApproveDevice ? 'mdi-check' : 'mdi-close'"
          ></v-icon>
          Auto Approve Device
        </v-chip>
        <MeshVpnModeSelect class="my-2" v-model="vpnMode"></MeshVpnModeSelect>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
