<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import type { Alert } from '@/plugins/alert'
import { loginAPI, tryRequest } from '@/plugins/api'
import { isMacOS, isMobile } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const loading = ref(false)
const alert = ref<Alert>({ on: false })
const { loginConfirmSession } = storeToRefs(useUserStore())

const redirectToAPP = isMobile() || isMacOS()
const countdown = ref(redirectToAPP ? 2 : 10)
const confirmed = ref(false)
const timer = ref()

async function confirm() {
  loading.value = true
  const ret = await tryRequest(async () => {
    await loginAPI.confirmSession(
      loginConfirmSession.value?.sessionID as string
    )
    confirmed.value = true

    // Start countdown
    timer.value = setInterval(
      () => {
        countdown.value--
        if (countdown.value <= 0) {
          redirectNow()
        }
      },
      1000 // 1 second
    )
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function redirectNow() {
  timer.value && clearInterval(timer.value)
  timer.value = null
  if (redirectToAPP) {
    if (isMacOS()) {
      window.location.href = 'cylonixauth://app/login-complete'
      return
    }
    window.location.href = 'https://cylonix.io/app/login-complete'
    return
  }
  router.push('/')
}
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="mx-auto pa-4" variant="text">
          <Alert v-model="alert" />

          <template v-if="!confirmed">
            <v-card-title class="text-h5 text-center mb-4">
              Confirm Device Connection
            </v-card-title>

            <v-card-text class="text-center">
              <p class="text-body-1 mb-4">
                <span class="font-weight-bold">{{
                  loginConfirmSession?.deviceName
                }}</span>
                is requesting to connect:
              </p>
              <v-list>
                <v-list-item>
                  <v-list-item-title>
                    <span class="font-weight-bold">{{
                      loginConfirmSession?.deviceOs
                    }}</span>
                    {{ loginConfirmSession?.deviceOsVersion }}
                  </v-list-item-title>
                </v-list-item>

                <v-list-item v-if="loginConfirmSession?.deviceModel">
                  <v-list-item-title>
                    <span class="font-weight-bold">Device Model:</span>
                    {{ loginConfirmSession?.deviceModel }}
                  </v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title>
                    <span class="font-weight-bold">Network Domain:</span>
                    {{ loginConfirmSession?.networkDomain }}
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <span class="font-weight-bold">Node Key:</span>
                    {{ loginConfirmSession?.nodeKey }}
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>
                    <span class="font-weight-bold">Machine Key:</span>
                    {{ loginConfirmSession?.machineKey }}
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>

            <v-card-actions class="justify-center">
              <v-btn
                class="px-4"
                variant="elevated"
                rounded="small"
                size="large"
                :loading="loading"
                @click="confirm"
              >
                Connect
              </v-btn>
            </v-card-actions>
          </template>

          <template v-else>
            <v-card-title class="text-h5 text-center mb-4">
              Device Connected
            </v-card-title>

            <v-card-text class="text-center">
              <p class="text-body-1 mb-4">
                {{
                  `Device is now being connected. You will be redirected ${
                    isMobile() || isMacOS()
                      ? 'back to the Cylonix APP'
                      : 'to the mangement portal'
                  } shortly.`
                }}
              </p>
              <p class="text-subtitle-1">
                Redirecting in {{ countdown }} seconds...
              </p>
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn color="primary" variant="text" @click="redirectNow">
                Redirect Now
              </v-btn>
            </v-card-actions>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
