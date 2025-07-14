<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
const emit = defineEmits(['change'])
const password = defineModel<string>()
const props = defineProps({
  newPassword: Boolean,
})

const confirmPasswordInput = ref()
const confirmPassword = ref()
const confirmLabel = ref()
const label = ref()

watchEffect(() => {
  const n = props.newPassword
  confirmLabel.value = n ? 'Confirm new password' : 'Confirm password'
  label.value = n ? 'New password' : 'Password'
})

function checkConfirmPasswordMatch(v: any) {
  return v == password.value || 'Passwords do not match'
}

function changePassword() {
  emit('change')
  confirmPasswordInput.value.validate()
}
</script>
<template>
  <PasswordInput v-model="password" :label="label" @change="changePassword" />
  <PasswordInput
    v-model="confirmPassword"
    ref="confirmPasswordInput"
    :label="confirmLabel"
    placeholder="Enter your password again"
    :addRules="[checkConfirmPasswordMatch]"
    @change="emit('change')"
  />
</template>
