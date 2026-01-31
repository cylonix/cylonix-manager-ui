<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">

const emit = defineEmits(['change'])
const name = defineModel<string>()
defineProps([
  'autocomplete',
  'icon',
  'label',
  'required',
  'min',
  'max',
])
</script>
<template>
  <AbstractNameInput
    v-model="name"
    :input-props="{
      autocomplete: autocomplete,
      clearable: true,
      density: 'compact',
    }"
    :min="min"
    :max="max"
    :label="label"
    :required="required"
    :prepend-inner-icon="icon"
    @change="emit('change')"
  >
  </AbstractNameInput>
</template>
