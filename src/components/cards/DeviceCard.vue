<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
defineProps(['device', 'variant'])
const headers = ref([
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'Device ID', key: 'id' },
  { title: 'Name', key: 'name' },
] as const)
</script>

<template>
  <v-card class="my-4 py-4" :variant="variant">
    <v-card-title>Device {{ device.name }}</v-card-title>
    <v-card-item>
      <v-data-table :items="[device]" :headers="headers" hide-default-footer>
        <template v-slot:bottom></template
      ></v-data-table>
    </v-card-item>
  </v-card>
</template>
