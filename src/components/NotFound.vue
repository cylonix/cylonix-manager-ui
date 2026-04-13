<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { mdiAlertCircleOutline, mdiHome } from '@mdi/js'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" class="text-center">
        <v-icon :icon="mdiAlertCircleOutline" size="80" color="grey" class="mb-4" />
        <h1 class="text-h3 mb-2">404</h1>
        <p class="text-h6 text-medium-emphasis mb-6">
          Page not found
        </p>
        <v-btn
          :prepend-icon="mdiHome"
          variant="flat"
          color="primary"
          @click="router.push('/')"
        >
          Go Home
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
