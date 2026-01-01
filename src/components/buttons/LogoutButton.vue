<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import { logout } from '@/plugins/logout'
defineProps<{asMenuItem: boolean}>()

const dialog = ref(false)
async function onOK() {
  dialog.value = false
  await logout()
}
</script>
<template>
  <v-btn v-if="!asMenuItem" class="mx-2" @click.stop="dialog = true">
    <v-icon icon="mdi-logout"></v-icon>
    <span class="d-none d-sm-inline ml-2">Sign out</span>
  </v-btn>
  <v-list-item v-else @click.stop="dialog = true" prepend-icon="mdi-logout">
    <v-list-item-title>Sign out</v-list-item-title>
  </v-list-item>
  <ConfirmDialog
    v-model="dialog"
    text="Signing out will remove session on Cylonix manager."
    @ok="onOK"
  ></ConfirmDialog>
</template>
