<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import type { Alert } from '@/plugins/alert'
import { otpAPI, tryRequest } from '@/plugins/api'

const emit = defineEmits(['change', 'sent'])
const code = defineModel<string>('code')
const codeSent = defineModel<boolean>('codeSent')

const alert = ref<Alert>({ on: false })
const from = ref('')
const loading = ref(false)
const props = defineProps([
  'email',
  'phone',
  'sendDisabled',
  'sendTitle',
  'sendAgainTitle',
  'variant',
])

const canSendCode = ref(true)
const interval = ref()
const timer = ref(0)

const label = computed(() => {
  const v = props.sendTitle ?? 'Send Code'
  if (codeSent.value) {
    return 'Resend'
  }
  return v
})

const { smAndUp } = useDisplay()
const fullWidthSendButton = computed(() => {
  return !(codeSent.value && smAndUp.value)
})

const checkCodeText = computed(() => {
  if (props.email) {
    return (
      'We have sent a verification code to ' +
      props.email +
      ' from ' +
      from.value +
      '. ' +
      'Please check your email including the spam folder and enter the code below.'
    )
  }
  return (
    'We have sent the code to ' +
    props.phone +
    '.' +
    "Please check your phone's text message and enter the code below"
  )
})

onBeforeUnmount(() => {
  clearInterval(interval.value)
})
onMounted(() => {
  interval.value = setInterval(() => {
    timer.value -= 1
    if (timer.value <= 0) {
      canSendCode.value = true
      timer.value = 60
    }
  }, 1000)
})

async function sendCode() {
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await otpAPI.sendCode(props.phone, props.email)
    if (ret.data.sendAgainTooSoon) {
      alert.value = {
        on: true,
        text: 'Send again too soon!',
      }
    } else if (ret.data.from) {
      from.value = ret.data.from
      codeSent.value = true
      emit('sent')
    }
    canSendCode.value = false
    timer.value = 30
    alert.value = {on: false}
  })
  if (ret) {
    console.log('sendCode error', ret)
    alert.value = ret
  }
  loading.value = false
}
</script>
<template>
  <Alert v-if="!code" v-model="alert"></Alert>
  <p v-if="codeSent && !code" align="center">{{ checkCodeText }}</p>
  <p v-if="code" align="center">
    <span class="text-subtitle-1">Verification Code</span>
  </p>
  <v-otp-input
    v-if="codeSent"
    autofocus
    focus-all
    focused
    v-model="code"
    :variant="variant || 'solo'"
    @update:model-value="emit('change')"
  ></v-otp-input>
  <v-row
    v-if="codeSent && !code"
    class="my-2 mx-2"
    :justify="codeSent ? 'end' : 'center'"
    align="center"
  >
    <v-progress-circular
      v-if="!canSendCode"
      color="teal mx-2"
      :model-value="(timer / 60) * 100"
      :rotate="360"
      :size="48"
      :width="4"
      >{{ timer }}
    </v-progress-circular>
    <span>Didn't receive the code?</span>
    <v-btn
      v-if="!fullWidthSendButton"
      variant="text"
      :disabled="!canSendCode || sendDisabled"
      :loading="loading"
      @click="sendCode()"
      >{{ label }}</v-btn
    >
  </v-row>
  <v-btn
    v-if="!code && fullWidthSendButton"
    block
    class="my-2"
    rounded="small"
    size="large"
    variant="tonal"
    :disabled="!canSendCode || sendDisabled"
    :loading="loading"
    @click="sendCode()"
    >{{ label }}</v-btn
  >
</template>
