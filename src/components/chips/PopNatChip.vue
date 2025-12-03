<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { PopNat } from '@/clients/supervisor'
defineProps<{
  nat: PopNat
  size?: string
}>()
const menu = ref(false)
</script>
<template>
  <v-menu
    v-model="menu"
    location="top start"
    origin="top start"
    transition  ="scale-transition"
  >
    <template v-slot:activator="{ props }">
      <v-chip class="mx-1 my-1" v-bind="props" :size="size">
        {{ nat.name }}
      </v-chip>
    </template>
    <v-card>
      <v-card-item
        ><v-data-table :items="[nat]" hide-default-footer>
          <template v-slot:bottom></template></v-data-table
      ></v-card-item>
    </v-card>
  </v-menu>
</template>
