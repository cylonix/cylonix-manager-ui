<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
import isMobilePhone from 'validator/es/lib/isMobilePhone'

const emit = defineEmits(['change'])
const phone = defineModel<string>('phone')
const code = defineModel<string>('code')

const phoneValid = computed(() => {
  return isMobilePhone(phone.value || '', 'en-US')
})
</script>
<template>
  <PhoneInput v-model="phone" required @change="emit('change')" />
  <CodeInput
    v-model:code="code"
    :phone="phone"
    :sendDisabled="!phoneValid"
    @change="emit('change')"
  />
</template>
