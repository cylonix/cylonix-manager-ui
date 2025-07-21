<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'

const authKeyDialog = ref(false)
const preAuthKeysRef = ref()

function onGenerated() {
  // Trigger reload with current options
  preAuthKeysRef.value?.loadItems(preAuthKeysRef.value?.loadOptions)
}
</script>
<template>
  <div class="container">
    <h2 class="mt-4">Keys</h2>
    <p>View and manage your Auth keys.</p>
    <p>
      Your private device keys are not included here: they are always private
      and stay on your device ONLY, and are never shared with Cylonix.
    </p>
    <v-row align="center" class="mt-4">
      <v-col cols="8">
        <h3>Auth Keys</h3>
        <p>Authenticate devices without an interactive login</p>
      </v-col>
      <v-col cols="4" class="text-end">
        <v-btn @click="authKeyDialog = true">
          Generate Auth Key...
        </v-btn>
      </v-col>
    </v-row>
    <VpnPreAuthKeys forUserOnly ref="preAuthKeysRef" />
  </div>
  <GenerateAuthKeyDialog v-model="authKeyDialog" @generated="onGenerated" />
</template>
