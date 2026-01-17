<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { V1Node } from '@/clients/headscale/api'

const props = defineProps<{
  item: V1Node
}>()

const emit = defineEmits(['click'])

function handleClick() {
  emit('click', props.item)
}
</script>

<template>
  <v-tooltip text="Share node" location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        icon="mdi-share-variant"
        variant="text"
        size="small"
        @click="handleClick"
      />
    </template>
  </v-tooltip>
</template>
