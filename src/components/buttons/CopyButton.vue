<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { newToast } from '@/plugins/toast'
import { mdiContentCopy } from '@mdi/js'
const emit = defineEmits(['click'])
const props = defineProps<{text: string, showToast?: boolean}>()
function click() {
  navigator.clipboard.writeText(props.text)
  if (props.showToast) {
    newToast({
      text: `Copied to clipboard: ${props.text}`,
      color: 'info',
      timeout: 2000,
      on: true,
    })
  }
  emit('click')
}
</script>
<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        class="mx-1"
        v-bind="props"
        :icon="mdiContentCopy"
        size="small"
        variant="plain"
        @click="click"
      >
      </v-btn>
    </template>
    <span>Copy</span>
  </v-tooltip>
</template>
