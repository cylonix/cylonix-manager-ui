<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
import { mdiArrowLeft } from '@mdi/js'
import { useQRCode } from '@vueuse/integrations/useQRCode'

const props = defineProps<{
  url?: string
}>()

const target = computed(() => {
  console.log('QR Sign-in URL:', props.url)
  return props.url ?? ''
})

// `qrcode` will be a ref of data URL and updates when `target` changes
const qrDataUrl = useQRCode(target, {
  width: 240,
  height: 240,
})

function goBack() {
  window.history.back()
}
</script>

<template>
  <div class="mt-4 qr-signin">
    <v-sheet class="mx-auto my-4 pa-3" rounded>
      <v-chip variant="plain" class="my-4" @click="goBack">
        <v-icon :icon="mdiArrowLeft" start></v-icon>
        Back</v-chip
      >
      <div class="my-4 text-center">
        <img :src="qrDataUrl" alt="Sign-in QR code" width="240" height="240" />
        <p class="my-4 text-body-2">
          Scan this QR code to open the sign in page on your mobile device.
        </p>
        <p class="text-caption truncate">
          <a :href="target" target="_blank">{{ target }}</a>
        </p>
      </div>
    </v-sheet>
  </div>
</template>

<style scoped>
.qr-signin img {
  border: 1px solid #ccc;
  border-radius: 6px;
  background: white;
  padding: 6px;
}
.truncate a {
  display: inline-block;
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
