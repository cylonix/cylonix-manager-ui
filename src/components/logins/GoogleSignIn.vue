<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from 'vuetify'

const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)
import { ref } from 'vue'
import type { Alert } from '@/plugins/alert'
import { loginAPI, tryRequest } from '@/plugins/api'
import getEnv from '@/utils/env'
const alert = defineModel<Alert>('alert')
const props = defineProps(['sessionID'])
const loading = ref(false)

async function loginWithGoogle() {
  loading.value = true
  const err = await tryRequest(async () => {
    const ret = await loginAPI.getOauthRedirectURL(
      'google',
      undefined,
      undefined,
      props.sessionID,
      undefined,
      undefined,
      getEnv('VITE_LOGIN_REDIRECT_BASE_URL') + '/' + props.sessionID
    )
    if (ret.data.encodedRedirectURL) {
      window.location.href = ret.data.encodedRedirectURL
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
    :class="['gsi-material-button', { 'dark-theme': isDark }]"
    @click="loginWithGoogle"
  >
    <div class="gsi-material-button-state"></div>
    <div class="gsi-material-button-content-wrapper">
      <div class="gsi-material-button-icon">
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          style="display: block; width: 18px; height: 18px"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          ></path>
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          ></path>
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          ></path>
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          ></path>
        </svg>
      </div>
      <span class="gsi-material-button-contents">Sign in with Google</span>
    </div>
  </button>
</template>

<style scoped>
.gsi-material-button {
  width: 100%;
  height: 40px;
  margin: 0 auto;
  padding: 0 12px;
  background-color: #fff;
  border: 1px solid #dadce0;
  border-radius: 4px;
  cursor: pointer;
  display: block;
  position: relative;
  transition: background-color 0.218s, border-color 0.218s, box-shadow 0.218s;
}

.gsi-material-button.dark-theme {
  background-color: #1f1f1f;
  border-color: #5f6368;
  color: #fff;
}

.gsi-material-button-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.gsi-material-button-icon {
  margin-right: 12px;
  min-width: 18px;
}

.gsi-material-button-contents {
  font-family: 'Google Sans', 'Roboto', arial, sans-serif;
  font-weight: 500;
  font-size: 14px;
  letter-spacing: 0.25px;
  color: #3c4043;
}

.dark-theme .gsi-material-button-contents {
  color: #e3e3e3;
}

.gsi-material-button-state {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.218s;
}

.gsi-material-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.gsi-material-button:hover {
  box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3),
    0 1px 3px 1px rgba(60, 64, 67, 0.15);
}

.dark-theme:hover {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
  background-color: #303030;
}

@media (max-width: 400px) {
  .gsi-material-button {
    width: 100%;
  }
}
</style>
