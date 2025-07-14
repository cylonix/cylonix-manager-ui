<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import type { Alert } from '@/plugins/alert'
defineProps<{
  fluid?: boolean
}>()
const emit = defineEmits(['close'])
const alert = defineModel<Alert>({ default: { on: false } })
function close() {
  alert.value.on = false
  emit('close')
}
</script>
<template>
  <v-container v-if="fluid ?? true">
    <v-alert
      v-model="alert.on"
      :text="alert.text"
      :title="alert.title"
      :type="alert.type ?? 'error'"
      closable
      @click:close="close"
      @click.native="close"
    >
    </v-alert>
  </v-container>
  <v-alert
    v-else
    v-model="alert.on"
    :text="alert.text"
    :title="alert.title"
    :type="alert.type ?? 'error'"
    closable
    @click:close="close"
    @click.native="close"
  ></v-alert>
</template>
