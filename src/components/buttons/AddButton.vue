<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { mergeProps } from 'vue'
defineProps(['label', 'parentProps'])
const emit = defineEmits(['click'])
function click() {
  emit('click')
}
</script>
<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props: tooltip }">
      <v-btn
        class="mx-1"
        v-bind="mergeProps(parentProps, tooltip)"
        icon="mdi-plus"
        size="small"
        variant="plain"
        @click="click"
      >
      </v-btn>
    </template>
    <span>{{ label ?? 'Add' }}</span>
  </v-tooltip>
</template>
