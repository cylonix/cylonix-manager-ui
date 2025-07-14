<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
defineProps(['color', 'loading', 'size'])
const emit = defineEmits(['refresh'])
</script>
<template>
  <v-btn
    :size="size"
    :loading="loading"
    variant="plain"
    @click="emit('refresh')"
  >
    <v-icon :color="color"> mdi-refresh </v-icon>
  </v-btn>
</template>
