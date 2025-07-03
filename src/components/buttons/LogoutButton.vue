<script setup lang="ts">
import { ref } from 'vue'
import { logout } from '@/plugins/logout'

const dialog = ref(false)
async function onOK() {
  dialog.value = false
  await logout()
}
</script>
<template>
  <v-btn class="mx-2" @click.stop="dialog = true">
    <v-icon icon="mdi-logout"></v-icon>
    <span class="d-none d-sm-inline ml-2">Sign out</span>
  </v-btn>
  <ConfirmDialog
    v-model="dialog"
    text="Signing out will remove session on Cylonix manager."
    @ok="onOK"
  ></ConfirmDialog>
</template>
