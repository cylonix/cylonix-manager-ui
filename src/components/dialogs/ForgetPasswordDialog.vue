<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import isEmail from 'validator/es/lib/isEmail'
import { computed, ref, watch } from 'vue'
import { VForm } from 'vuetify/components'
import type { Alert } from '@/plugins/alert'
import { tryRequest, otpAPI, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
const props = defineProps<{ email: string }>()
const alert = ref<Alert>({ on: false })
const code = ref<string>('')
const codeSent = ref(false)
const codeVerified = ref(false)
const canSendCode = ref(true)
const dialog = ref(false)
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const password = ref()

const ready = computed(() => {
  return isFormValid.value !== false && emailValid.value
})

const emailValid = computed(() => {
  return isEmail(props.email || '')
})

const title = computed(() => {
  return 'Forget password'
})

watch(() => props.email, (newValue) => {
  if (newValue) {
    console.log('Dialog opened, resetting state')
    code.value = ''
    codeSent.value = false
    canSendCode.value = true
    codeVerified.value = false
    alert.value = { on: false }
  }
})

async function resetPassword() {
  const { valid } = await form.value!.validate()
  if (!valid) {
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.resetPassword({
      namespace: '',
      loginName: props.email,
      oneTimeCodeCheck: {
        emailOrPhone: props.email,
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
  console.log('Done resetting password.')
  loading.value = false
  if (ret) {
      if (ret.text?.includes('same_password')) {
      alert.value = {
        on: true,
        text: 'New password cannot be the same as the old password.',
      }
      return
    }
    alert.value = ret
  }
}

async function verifyCode() {
  if (!code.value) {
    alert.value = {
      on: true,
      text: 'Please enter the verification code.',
    }
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    const ret = await otpAPI.verifyCode(
      code.value,
      undefined, // phone
      props.email,
      undefined, // namespace
      undefined, // want_approval_state
      true // want new code
    )
    if (!ret.data) {
      alert.value = {
        on: true,
        text: 'Invalid exchanged code returned.',
      }
      return
    }
    newToast({
      on: true,
      color: 'green',
      text: 'Verification code is valid.',
    })
    codeVerified.value = true
    // Set to new code once verified to be used for password reset
    console.log('Setting code to new exchanged code:', ret.data)
    code.value = ret.data
    alert.value = { on: false }
  })
  loading.value = false
  if (ret) {
    alert.value = ret
  }
}

function submit() {
  resetPassword()
}

function resetInput() {
  code.value = ''
  codeSent.value = false
  canSendCode.value = true
  codeVerified.value = false
  password.value = undefined
  alert.value = { on: false }
}
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    max-width="800"
    min-width="600"
    :okDisabled="!ready"
    okText="Reset Password"
    :title="title"
    @ok="submit"
    ><template v-slot:item>
      <p v-if="!codeVerified" class="text-center font-weight-bold mb-2">
        Reset password by verifying your email with a one time code first.
      </p>
      <p v-else class="text-center font-weight-bold mb-2">
        Enter your new password below to reset your password.
      </p>

      <Alert v-model="alert"></Alert>
      <p class="text-center mb-2" v-if="!codeSent">Email: {{ props.email }}</p>
      <v-form class="mt-2" ref="form" v-model="isFormValid" auto-complete="on">
        <CodeInput
          class="mt-2"
          v-if="!codeVerified"
          v-model:code="code"
          v-model:codeSent="codeSent"
          v-model:canSendCode="canSendCode"
          variant="filled"
          :email="email"
          :sendDisabled="!emailValid"
          sendTitle="Send Code to Email"
          sendAgainTitle="Send Code to Email again"
        />
        <PasswordWithConfirmationInput
          v-else
          class="mt-4"
          v-model="password"
          new-password
          @change="alert={on: false}"
        />
        <v-btn
          class="d-block mx-auto mt-4"
          v-if="!codeVerified && code"
          @click="verifyCode"
          >Verify Code</v-btn
        >
        <v-btn
          class="d-block mx-auto mt-4"
          v-if="code || password"
          variant="text"
          @click="resetInput"
          >Start Over</v-btn
        >
      </v-form>
    </template></ConfirmDialog
  >
</template>
