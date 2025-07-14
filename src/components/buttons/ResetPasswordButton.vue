<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
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
        icon="mdi-key-change"
        size="small"
        variant="plain"
        @click="click"
      >
      </v-btn>
    </template>
    <span>Reset Password</span>
  </v-tooltip>
</template>
