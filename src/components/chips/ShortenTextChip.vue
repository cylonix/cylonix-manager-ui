<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
const props = defineProps<{
  text: string
  shortText?: string
  size?: string
  start?: number
  shown?: number
}>()
const menu = ref(false)
const label = computed(() => {
  if (props.shortText) {
    return props.shortText
  }
  const start = props.start ?? 0
  const end = start + (props.shown ?? 13)
  return props.text.substring(start, end)
})
function copyText() {
  navigator.clipboard.writeText(props.text)
}
</script>
<template>
  <v-menu
    v-model="menu"
    location="top start"
    origin="top start"
    transition="scale-transition"
  >
    <template v-slot:activator="{ props }">
      <v-chip v-bind="props" :size="size" variant="text">
        {{ label }}
      </v-chip>
    </template>
    <v-card>
      <v-card-item
        ><v-chip
          @click="copyText"
          @click:close="menu = false"
          size="large"
          variant="text"
          >{{ text }}
        </v-chip></v-card-item
      >
    </v-card>
  </v-menu>
</template>
