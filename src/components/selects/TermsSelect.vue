<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
const value = defineModel('value')
</script>
<template>
  <v-checkbox
    v-model="value"
    class="text-caption"
    color="secondary"
    density="compact"
    hide-details="auto"
    required
    :rules="[(v) => !!v || 'Please agree to continue!']"
    ><template v-slot:label>
      <span><small>I agree to site terms and conditions</small></span>
    </template></v-checkbox
  >
</template>
