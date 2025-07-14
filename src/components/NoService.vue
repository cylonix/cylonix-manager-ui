<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
function login() {
  router.push('/login')
}
</script>

<template>
  <v-container align-center class="fill-height">
    <v-sheet class="mx-auto">
      <v-card variant="flat"
        ><v-card-title>Please login to continue</v-card-title>
        <v-card-text
          >Sign in to Cylonix manager to manager users, devices, policies et al.
        </v-card-text>
        <v-card-actions>
          <v-btn block variant="tonal" @click="login"> Sign in </v-btn>
        </v-card-actions>
      </v-card>
    </v-sheet>
  </v-container>
</template>
