<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Alert } from '@/plugins/alert'
import { loginAPI, tryRequest } from '@/plugins/api'
import { LoginType } from '@/clients/manager/api'
import { useUserStore } from '@/stores/user'
const alert = ref<Alert>({ on: false })
const loading = ref<boolean>(false)
const router = useRouter()
const userStore = useUserStore()

interface Props {
  sessionID?: string
}
const props = defineProps<Props>()

// Watch effect to handle the session ID
const route = useRoute()
watch(
  () => props.sessionID || route.params.sessionID,
  async (sessionID) => {
    if (sessionID) {
      console.log('Oauth-Success: session ID =', sessionID)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (!userStore.loggedIn) {
    console.log('trying to login with oauth success token')
    loading.value = true
    const ret = await tryRequest(async () => {
      const ret = await loginAPI.login(
        LoginType.Username,
        undefined,
        undefined,
        undefined,
        props.sessionID
      )
      userStore.$patch((state) => {
        state.tenant = ret.data.tenant
        state.user = ret.data.user
        state.updatedAt = Date.now()
        console.log('login success', ret.data)
        const confirmSession = ret.data.confirmSession
        if (confirmSession && confirmSession.sessionID === props.sessionID) {
          state.loginConfirmSession = confirmSession
          router.push('/confirm-session')
        } else {
          router.push('/')
        }
      })
    })
    loading.value = false
    if (ret) {
      alert.value = <Alert>{
        on: true,
        text:
          `${ret.text}. You will be redirect ` + 'to sign in page in a moment.',
        title: 'Sign in failed.',
      }
      setTimeout(() => router.push('/login'), 5000)
    }
  } else {
    console.log('oauth-success: user is already logged in.')
  }
})
</script>
<template>
  <v-container class="fill-height">
    <v-card><v-card-title>Sign in</v-card-title></v-card>
    <Alert v-model="alert" fluid></Alert>
  </v-container>
  <v-overlay v-model="loading">
    <v-progress-circular indeterminate color="primary"> </v-progress-circular>
  </v-overlay>
</template>
