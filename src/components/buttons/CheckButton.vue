<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps(['size', 'success', 'tooltip', 'valid'])
const emit = defineEmits(['check'])
const color = computed(() => {
  if (props.success) {
    return 'green'
  }
  if (props.success === false) {
    return 'red'
  }
  if (props.valid) {
    return 'blue'
  }
  return 'grey'
})
const icon = computed(() => {
  if (props.success) {
    return 'mdi-thumb-up'
  }
  if (props.success === false) {
    return 'mdi-thumb-down'
  }
  return 'mdi-check'
})
</script>
<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        :disabled="!valid || success != undefined"
        :color="color"
        :size="size"
        variant="plain"
        @click="emit('check')"
      >
        <v-icon :size="size">{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>
