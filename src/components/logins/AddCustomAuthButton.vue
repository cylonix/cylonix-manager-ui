<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { mdiOpenid } from '@mdi/js'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

import { useRouter } from 'vue-router'
const router = useRouter()

async function addCustomAuth() {
  router.push('/add-custom-auth')
}
</script>
<template>
  <button
    :class="['login-button', { 'dark-theme': isDark }]"
    @click="addCustomAuth"
  >
    <div class="login-button-state"></div>
    <div class="login-button-content-wrapper">
      <div class="login-button-icon">
        <v-icon :color="isDark ? 'white' : 'black'" size="24" :icon="mdiOpenid">
        </v-icon>
      </div>
      <span class="login-button-contents">Add Custom OIDC Sign-In</span>
    </div>
  </button>
</template>

<style scoped>
.login-button {
  width: 100%;
  min-height: 40px;
  margin: 8px 0;
  padding: 8px 16px;
  background-color: #fff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background-color 0.218s, border-color 0.218s, box-shadow 0.218s;
}

.login-button.dark-theme {
  background-color: #1f1f1f;
  border-color: #5f6368;
  color: #fff;
}

.login-button-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.login-button-icon {
  display: flex;
  align-items: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.login-button-contents {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.25px;
  color: #3c4043;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark-theme .login-button-contents {
  color: #e3e3e3;
}
.login-button-state {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.218s;
}

.login-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.login-button:hover {
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.dark-theme:hover {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
  background-color: #303030;
}

@media (max-width: 400px) {
  .login-button {
    width: 100%;
  }
}
</style>
