<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits(['change'])
const username = defineModel<string>()
const rules = ref([
  (v: any) => !!v || 'Username is required',
  (v: any) =>
    (v && v.length >= 5 && v.length <= 30) ||
    'Username must be between 5 and 30 characters.',
])
</script>
<template>
  <AbstractNameInput
    v-model="username"
    :input-props="{
      autocomplete: 'username',
      clearable: true,
      density: 'compact',
      rules: rules,
      prependInnerIcon: 'mdi-account-outline',
    }"
    label="Username"
    required
    @change="emit('change')"
  >
  </AbstractNameInput>
</template>
