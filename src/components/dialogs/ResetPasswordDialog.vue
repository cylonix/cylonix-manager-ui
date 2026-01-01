<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { VForm } from 'vuetify/components'
import { ChangePassword, User } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
const props = defineProps<{ user?: User }>()
const dialog = defineModel<boolean>()

const alert = ref<Alert>({ on: false })
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const note = ref()
const password = ref()

const ready = computed(() => {
  const u = props.user
  if (!u || u.logins.length <= 0) {
    return false
  }
  return isFormValid.value !== false && password.value
})

function describeUser(user?: User): string {
  const name = user?.displayName
  return user?.logins[0]?.login + (name ? `(${name})` : '')
}

const text = computed(() => {
  const u = props.user
  const d = describeUser(u)
  if (!u || u.logins.length <= 0) {
    return `Cannot change password for user "${d}" without logins.`
  }
  return `Change password for "${d}"`
})

async function changePassword() {
  const { valid } = await form.value!.validate()
  if (!valid) {
    return
  }

  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.changePassword(props.user?.userID ?? '', <ChangePassword>{
      newPassword: password.value,
    })
    dialog.value = false
    newToast({
      on: true,
      color: 'green',
      text: 'User password change success.',
    })
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done changing user password.')
  loading.value = false
}
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    max-width="600"
    min-width="400"
    :okDisabled="!ready"
    okText="Submit"
    :text="text"
    title="Change password"
    @ok="changePassword"
    ><template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form class="mt-2" ref="form" v-model="isFormValid" auto-complete="on">
        <PasswordWithConfirmationInput v-model="password" />
        <NoteInput class="mt-4" v-model="note" />
      </v-form> </template
  ></ConfirmDialog>
</template>
