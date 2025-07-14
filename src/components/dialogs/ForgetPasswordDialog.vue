<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import isEmail from 'validator/es/lib/isEmail'
import { computed, ref } from 'vue'
import { VForm } from 'vuetify/components'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import EmailInput from '../inputs/EmailInput.vue'

const namespace = defineModel<string>('namespace')
const namespaceType = defineModel<string>('namespaceType')

const alert = ref<Alert>({ on: false })
const code = ref()
const codeSent = ref(false)
const dialog = ref(false)
const email = ref()
const forget = ref('password')
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const password = ref()
const username = ref()

const ready = computed(() => {
  return isFormValid.value
})

const emailValid = computed(() => {
  return isEmail(email.value || '')
})

const title = computed(() => {
  if (forget.value == 'username') {
    return 'Forget username'
  }
  return 'Forget password'
})

async function resetPassword() {
  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.resetPassword({
      namespace: namespace.value ?? '',
      loginName: username.value,
      oneTimeCodeCheck: {
        emailOrPhone: email.value,
        code: code.value,
        isPhone: false,
      },
      newPassword: password.value,
    })
    newToast({
      on: true,
      color: 'green',
      text: 'Password reset success.',
    })
    dialog.value = false
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done resetting password.')
  loading.value = false
}

async function sendUsername() {
  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.sendUsername(namespace.value, email.value)
    newToast({
      on: true,
      color: 'green',
      text: 'Username sent.',
    })
    dialog.value = false
  })
  if (ret) {
    alert.value = ret
  }
  console.log('Done sending username.')
  loading.value = false
}

function submit() {
  if (forget.value == 'username') {
    sendUsername()
  } else {
    resetPassword()
  }
}
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    max-width="800"
    min-width="600"
    :okDisabled="!ready"
    okText="Submit"
    text="Recover username or password"
    :title="title"
    @ok="submit"
    ><template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-tabs v-model="forget" class="mb-4" grow>
        <v-tab value="username" text="Forget username"></v-tab>
        <v-tab value="password" text="Forget password"></v-tab>
      </v-tabs>

      <v-tabs-window v-model="forget">
        <v-tabs-window-item value="username">
          <v-chip class="my-4" variant="text">Send username to email:</v-chip>
          <NamespaceWithSwitchInput
            v-model:namespace="namespace"
            v-model:namespaceType="namespaceType"
          >
          </NamespaceWithSwitchInput>
          <EmailInput v-model="email"></EmailInput>
          <v-btn class="my-2" block>Send</v-btn>
        </v-tabs-window-item>
        <v-tabs-window-item value="password">
          <v-form ref="form" v-model="isFormValid" auto-complete="on">
            <NamespaceWithSwitchInput
              v-model:namespace="namespace"
              v-model:namespaceType="namespaceType"
            >
            </NamespaceWithSwitchInput>
            <EmailInput v-model="email" required></EmailInput>
            <CodeInput
              v-model:code="code"
              v-model:codeSent="codeSent"
              :email="email"
              :sendDisabled="!emailValid"
              sendTitle="Send Code to Email"
              sendAgainTitle="Send Code to Email again"
            />
            <UsernameInput v-model="username"></UsernameInput>
            <PasswordWithConfirmationInput v-model="password" new-password />
          </v-form>
        </v-tabs-window-item>
      </v-tabs-window> </template
  ></ConfirmDialog>
</template>
