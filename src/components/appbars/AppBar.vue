<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWsNotices } from '@/composables/wsnotices'
import { loginAPI, tryRequest } from '@/plugins/api'
import { LoginType } from '@/clients/manager/api'

import { useNoticeStore } from '@/stores/notices'
import { useToastStore } from '@/stores/toast'
import { useUserStore } from '@/stores/user'
import { useLoginStore } from '@/stores/login'

const drawer = defineModel<boolean>('drawer')
defineProps(['title'])

const router = useRouter()
const route = useRoute()
const { alert, toggle } = useWsNotices()
const { toast } = storeToRefs(useToastStore())
const userStore = useUserStore()
const { isAdmin, loggedIn, username, user } = storeToRefs(userStore)
const loginStore = useLoginStore()
const { loginType } = storeToRefs(loginStore)
const { wsStatus, wsStatusColor } = storeToRefs(useNoticeStore())

const userMenuOpen = ref(false)
const changePasswordDialog = ref(false)

const isLoginRoute = computed(() => {
  return route.path == '/login'
})

const userAvatar = computed(() => {
  // If user has a profile picture URL, use it
  if (user.value?.profilePicURL) {
    return user.value.profilePicURL
  }
  // Otherwise, return null to show initials
  return null
})

const userInitials = computed(() => {
  // Try to get initials from display name first
  if (user.value?.displayName) {
    const names = user.value.displayName.trim().split(' ')
    if (names.length >= 2) {
      const first = names[0]?.[0]
      const last = names[names.length - 1]?.[0]
      if (first && last) {
        return (first + last).toUpperCase()
      }
    }
    if (user.value.displayName[0]) {
      return user.value.displayName[0].toUpperCase()
    }
  }
  // Fallback to username
  if (username.value && username.value[0]) {
    return username.value[0].toUpperCase()
  }
  return 'U'
})

function closeAlert() {
  alert.value = undefined
}

function openChangePassword() {
  changePasswordDialog.value = true
  userMenuOpen.value = false
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
          v-if="wsStatus"
          @click="toggle"
          ><template v-slot:prepend>
            <v-icon :color="wsStatusColor" icon="mdi-bell"></v-icon> </template
          ><span>{{ wsStatus }}</span></v-chip
        >
      </template>
      <span class="d-none d-md-inline"
        >Server notification websocket status</span
      >
    </v-tooltip>

    <!-- User Profile Menu -->
    <v-menu
      v-if="loggedIn"
      v-model="userMenuOpen"
      :close-on-content-click="false"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-avatar :color="userAvatar ? undefined : 'primary'" size="40">
            <v-img v-if="userAvatar" :src="userAvatar" alt="Profile"></v-img>
            <span v-else class="text-white">{{ userInitials }}</span>
          </v-avatar>
        </v-btn>
      </template>

      <v-card min-width="250">
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar :color="userAvatar ? undefined : 'primary'" size="40">
                <v-img
                  v-if="userAvatar"
                  :src="userAvatar"
                  alt="Profile"
                ></v-img>
                <span v-else class="text-white">{{ userInitials }}</span>
              </v-avatar>
            </template>
            <v-list-item-title>{{ username }}</v-list-item-title>
            <v-list-item-subtitle v-if="user?.email">{{
              user.email
            }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list v-if="loginType == LoginType.Username">
          <v-list-item
            prepend-icon="mdi-lock-reset"
            @click="openChangePassword"
          >
            <v-list-item-title>Change Password</v-list-item-title>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>

        <v-list>
          <LogoutButton asMenuItem></LogoutButton>
        </v-list>
      </v-card>
    </v-menu>

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

  <ResetPasswordDialog
    v-if="loggedIn"
    v-model="changePasswordDialog"
    :user="user"
  />
</template>
