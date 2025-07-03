<script setup lang="ts">
import { computed } from 'vue'
import isEmail from 'validator/es/lib/isEmail'
defineProps({
  withCode: Boolean,
  withEmail: Boolean,
  withPassword: Boolean,
  withPhone: Boolean,
  withUsername: Boolean,
})
const emit = defineEmits(['change'])
const code = defineModel<string>('code')
const codeSent = defineModel<boolean>('codeSent')
const email = defineModel<string>('email')
const name = defineModel<string>('name')
const password = defineModel<string>('password')
const phone = defineModel<string>('phone')
const username = defineModel<string>('username')

const emailRequired = computed(() => {
  return !phone.value
})
const emailValid = computed(() => {
  return isEmail(email.value || '')
})
const phoneRequired = computed(() => {
  return !email.value
})
function emailChanged() {
  emit('change')
}
function phoneChanged() {
  emit('change')
}
</script>
<template>
  <NameInput
    v-model="name"
    autocomplete="name"
    label="Name (First Last)"
    required
    @change="emit('change')"
  />
  <PhoneInput
    v-if="withPhone"
    v-model="phone"
    requiredMessage="Phone or email is required"
    :required="phoneRequired"
    @change="phoneChanged"
  />
  <EmailInput
    v-if="withEmail"
    v-model="email"
    requiredMessage="Phone or email is required"
    :required="emailRequired"
    @change="emailChanged"
  />
  <CodeInput
    v-if="withEmail && emailValid && withCode"
    v-model:code="code"
    v-model:codeSent="codeSent"
    :email="email"
    :sendDisabled="!emailValid"
    sendTitle="Send Code to Email"
    sendAgainTitle="Send Code to Email again"
    @change="emit('change')"
  />
  <UsernameInput
    v-if="withUsername"
    v-model="username"
    @change="emit('change')"
  />
  <PasswordWithConfirmationInput
    v-if="withPassword"
    v-model="password"
    @change="emit('change')"
  />
</template>
