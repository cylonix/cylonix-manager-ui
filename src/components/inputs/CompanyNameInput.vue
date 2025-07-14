<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
defineProps<{
  checkAvailable?: boolean
}>()
const emit = defineEmits(['change'])
const name = defineModel<string>()

function updated() {
  emit('change')
}
</script>
<template>
  <CompanyNameOrNamespaceInput
    v-model="name"
    :check="checkAvailable"
    check-tooltip="Check if company name is available"
    label="Enterprise name"
    :max="60"
    :min="8"
    @change="updated"
  >
  </CompanyNameOrNamespaceInput>
</template>
