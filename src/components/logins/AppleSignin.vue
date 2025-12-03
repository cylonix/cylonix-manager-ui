<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { ref } from 'vue'
import type { Alert } from '@/plugins/alert'
import { loginAPI, tryRequest } from '@/plugins/api'
import getEnv from '@/utils/env'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
const alert = defineModel<Alert>('alert')
const props = defineProps(['sessionID', 'inviteCode', 'redirect'])
const loading = ref(false)

async function loginWithApple() {
  loading.value = true
  console.log('invite code', props.inviteCode)
  const err = await tryRequest(async () => {
    const ret = await loginAPI.getOauthRedirectURL(
      'apple',
      undefined,
      undefined,
      props.sessionID,
      props.inviteCode,
      undefined,
      undefined,
      getEnv('VITE_LOGIN_REDIRECT_BASE_URL') +
        '/' +
        (props.sessionID ?? (props.redirect
          ? `?redirect=${encodeURIComponent(props.redirect ?? '')}`
          : ''))
    )
    if (ret.data.encodedRedirectURL) {
      window.location.href = ret.data.encodedRedirectURL ?? ''
    } else {
      throw `Redirect URL invalid: ${ret.data}`
    }
  })
  loading.value = false
  if (err) {
    alert.value = err
  }
}
</script>
<template>
  <button
    :class="['apple-button', { 'dark-theme': isDark }]"
    @click="loginWithApple"
  >
    <div class="apple-button-state"></div>
    <div class="apple-button-content-wrapper">
      <div class="apple-button-icon">
        <v-icon :color="isDark ? 'white' : 'black'" size="24">
          mdi-apple
        </v-icon>
      </div>
      <span class="apple-button-contents">Sign in with Apple</span>
    </div>
  </button>
</template>

<style scoped>
.apple-button {
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

.apple-button.dark-theme {
  background-color: #1f1f1f;
  border-color: #5f6368;
  color: #fff;
}

.apple-button-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.apple-button-icon {
  display: flex;
  align-items: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.apple-button-contents {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.25px;
  color: #3c4043;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark-theme .apple-button-contents {
  color: #e3e3e3;
}
.apple-button-state {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.218s;
}

.apple-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.apple-button:hover {
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.dark-theme:hover {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
  background-color: #303030;
}

@media (max-width: 400px) {
  .apple-button {
    width: 100%;
  }
}
</style>
