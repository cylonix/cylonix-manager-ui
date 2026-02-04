<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { mdiDotsHorizontal } from '@mdi/js'
const emit = defineEmits(['click'])
function click() {
  emit('click')
}
</script>
<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        class="mx-1"
        v-bind="props"
        :icon="mdiDotsHorizontal"
        size="small"
        variant="text"
        @click="click"
      >
      </v-btn>
    </template>
    <span>More</span>
  </v-tooltip>
</template>
