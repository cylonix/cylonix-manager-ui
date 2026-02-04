<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
import { mdiThumbUp, mdiThumbDown, mdiCheck } from '@mdi/js'
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
    return mdiThumbUp
  }
  if (props.success === false) {
    return mdiThumbDown
  }
  return mdiCheck
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
        <v-icon :size="size" :icon="icon" />
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>
