<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { formatExpiry } from '@/plugins/date'
defineProps<{
  expiry: string | undefined
  withPrefix?: boolean
}>()
const emit = defineEmits([
  'set',
  'disable',
  'now',
])

function expiryState(expiry: string | undefined): string {
  const s = formatExpiry(expiry)
  if (!s) {
    return 'expired'
  }
  if (s === 'never') {
    return 'disabled'
  }
  return 'future'
}

</script>
<template v - slot: item.expiry = "{ item }" >
  <v-menu>
    <template v-slot:activator="{ props }">
      <v-chip
        v-bind="props"
        :color="formatExpiry(expiry) ? 'default' : 'error'"
        size="small"
        variant="plain"
        class="px-0 cursor-pointer"
      >
        <span v-if="formatExpiry(expiry)">{{
          formatExpiry(expiry) === 'never'
            ? withPrefix ? 'never expires' : 'never'
            :
          withPrefix ? 'expires ' + formatExpiry(expiry) : formatExpiry(expiry)
        }}</span>
        <span v-else>expired</span>
      </v-chip>
    </template>
    <v-list>
      <v-list-item
        v-if="expiryState(expiry) != 'disabled'"
        @click="emit('disable')"
      >
        <v-list-item-title>
          <v-icon class="mr-2">mdi-cancel</v-icon>
          Disable Expiry
        </v-list-item-title>
      </v-list-item>
      <v-list-item @click="emit('set')">
        <v-list-item-title>
          <v-icon class="mr-2">mdi-calendar-clock</v-icon>
          Set Expiry Time
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="expiryState(expiry) != 'expired'"
        @click="emit('now')"
      >
        <v-list-item-title>
          <v-icon class="mr-2">mdi-clock-alert</v-icon>
          Expire Now
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
