<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
defineProps(['hint', 'loading', 'required', 'roles', 'title'])
const emit = defineEmits(['refresh'])
const value = defineModel<any>()
</script>
<template>
  <v-select
    v-model="value"
    :items="roles ?? []"
    item-title="name"
    item-subtitle="description"
    item-value="name"
    :label="title ?? 'Select roles'"
    :loading="loading"
    density="compact"
    chips
    multiple
    :rules="[(v) => !required || !!(v && v.length) || 'Role is required']"
    ><template v-slot:append-inner>
      <RefreshButton
        :loading="loading"
        size="24"
        @refresh="emit('refresh')"
      /> </template
  ></v-select>
</template>
