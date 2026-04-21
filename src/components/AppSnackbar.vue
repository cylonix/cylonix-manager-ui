<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useToastStore } from '@/stores/toast'

const { toast } = storeToRefs(useToastStore())
</script>

<template>
  <v-snackbar
    v-model="toast.on"
    location="top right"
    :color="toast.color"
    :text="toast.text"
    :timeout="toast.timeout ?? 4000"
    close-on-content-click
  />
</template>
