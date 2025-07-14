<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWsNotices } from '@/composables/wsnotices'
import { loginAPI, tryRequest } from '@/plugins/api'
import { useNoticeStore } from '@/stores/notices'
import { useToastStore } from '@/stores/toast'
import { useUserStore } from '@/stores/user'

const drawer = defineModel<boolean>('drawer')
defineProps(['title'])

const router = useRouter()
const route = useRoute()
const { alert, connect, status } = useWsNotices()
const { toast } = storeToRefs(useToastStore())
const { isAdmin, loggedIn, username } = storeToRefs(useUserStore())
const { wsStatusColor } = storeToRefs(useNoticeStore())

const isLoginRoute = computed(() => {
  return route.path == '/login'
})

function closeAlert() {
  alert.value = undefined
}

setInterval(async () => {
  if (loggedIn.value) {
    console.log('logged in, refreshing token...')
    await tryRequest(async () => {
      await loginAPI.refreshToken()
      console.log('token refreshed.')
    })
  }
}, 600 * 1000 /* 600 seconds */)
</script>
<template>
  <v-app-bar elevation="1" app fixed clipped-left>
    <v-app-bar-nav-icon
      variant="text"
      @click.stop="drawer = !drawer"
    ></v-app-bar-nav-icon>
    <v-btn
      class="d-flex align-center justify-center"
      @click.stop="router.push('/')"
    >
      <v-img width="32" src="@/assets/logo.png"></v-img>
      <span class="ml-2 d-sm-none">Cylonix</span>
    </v-btn>
    <v-app-bar-title class="d-none d-sm-flex">{{ title }}</v-app-bar-title>
    <v-spacer></v-spacer>
    <slot />
    <v-snackbar
      v-model="toast.on"
      location="top center"
      :color="toast.color"
      :text="toast.text"
      close-on-content-click
    ></v-snackbar>
    <ToggleThemeButton></ToggleThemeButton>
    <v-tooltip v-if="isAdmin" location="top">
      <template v-slot:activator="{ props }">
        <v-chip
          class="mx-2 d-none d-md-flex"
          v-bind="props"
          v-if="status"
          @click="connect"
          ><template v-slot:prepend>
            <v-icon :color="wsStatusColor" icon="mdi-bell"></v-icon> </template
          ><span>{{ status }}</span></v-chip
        >
      </template>
      <span class="d-none d-md-inline"
        >Server notification websocket status</span
      >
    </v-tooltip>
    <v-chip class="mx-2 d-none d-md-flex" v-if="loggedIn">{{
      username
    }}</v-chip>
    <LogoutButton v-if="loggedIn" />
    <v-btn
      class="mx-2"
      v-if="!loggedIn && !isLoginRoute"
      @click.stop="router.push('/login')"
      >Sign in</v-btn
    >
    <ConfirmContinueSessionDialog
      v-if="loggedIn"
    ></ConfirmContinueSessionDialog>
    <template v-if="alert" v-slot:extension>
      <Alert v-model="alert" @close="closeAlert"></Alert>
    </template>
  </v-app-bar>
</template>
