<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VForm } from 'vuetify/components'
import isEmail from 'validator/es/lib/isEmail'
import { AdditionalAuthInfo, LoginType, MfaType } from '@/clients/manager/api'
import { UnauthorizedError, loginAPI } from '@/plugins/api'
import type { Alert } from '@/plugins/alert'
import { useLoginStore } from '@/stores/login'
import { useUserStore } from '@/stores/user'
import getEnv from '@/utils/env'
import { AxiosError } from 'axios'

const alert = ref<Alert>({ on: false })
const code = ref()
const codeSent = ref(false)
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loginType = ref<LoginType>()
const loading = ref(false)
const namespace = ref()
const namespaceType = ref('community')
const password = ref()
const saveApiKey = getEnv('VITE_SAVE_API_KEY')
const username = ref()

const canLogin = computed(() => {
  return (
    isFormValid.value &&
    ((loginType.value != LoginType.Phone && username.value) ||
      (code.value && code.value.length == 6))
  )
})

const codeIsReady = computed(() => {
  return (
    (mfaNeeded.value?.length && code.value && code.value.length == 6) ||
    !mfaNeeded.value?.length
  )
})

const signInLabel = computed(() => {
  return username.value ? 'Sign In' : 'Please input your email to sign in'
})

const route = useRoute()

interface Props {
  sessionID?: string
  inviteCode?: string
  redirect?: string
}
const props = defineProps<Props>()

watch(
  () => props.sessionID || route.params.sessionID,
  async (sessionID) => {
    if (sessionID) {
      console.log('Session ID:', sessionID)
    }
  },
  { immediate: true }
)
watch(
  () => props.inviteCode || route.params.inviteCode,
  async (inviteCode) => {
    if (inviteCode) {
      console.log('Code:', inviteCode)
    }
  },
  { immediate: true }
)
const router = useRouter()
const userStore = useUserStore()
const loginStore = useLoginStore()

namespace.value = loginStore.namespace
namespaceType.value = loginStore.namespaceType
loginType.value = loginStore.loginType
if (!Object.values(LoginType).includes(loginType.value)) {
  loginType.value = LoginType.Username
}

watch(namespaceType, (newValue) => {
  loginStore.$patch((state) => {
    state.namespaceType = newValue
  })
})
watch(namespace, (newValue) => {
  loginStore.$patch((state) => {
    state.namespace = newValue
  })
})

const mfaNeeded = ref<MfaType[]>([])
const emailValid = computed(() => {
  return isEmail(username.value || '')
})
const emailCodeHint = computed(() => {
  if (!codeSent.value) {
    return 'Email verification code is required.'
  }
  return ''
})

async function submit() {
  let type = loginType.value
  let loginID = username.value
  let credential = password.value
  loading.value = true

  console.log('SessionID', props.sessionID ?? "Not set", 'Code', props.inviteCode)
  if (type !== LoginType.Username) {
    try {
      const ret = await loginAPI.getOauthRedirectURL(
        undefined,
        undefined,
        loginID,
        props.sessionID,
        props.inviteCode,
      )
      if (ret.data.isDirectLoginWithPassword) {
        loginType.value = LoginType.Username
      } else if (ret.data.encodedRedirectURL) {
        window.location.href = ret.data.encodedRedirectURL
      } else {
        throw `Redirect URL invalid: ${ret.data}`
      }
    } catch (e: any) {
      if (e instanceof UnauthorizedError) {
        alert.value = {
          on: true,
          title: 'Not signed up yet!',
          text: 'Your email is not yet signed up.',
          type: 'error',
        }
      } else {
        alert.value = {
          on: true,
          title: 'Error',
          text: e.toString(),
          type: 'error',
        }
      }
    }
    loading.value = false
    return
  }

  try {
    const ret = await loginAPI.login(
      type,
      undefined,
      namespace.value,
      loginID,
      props.sessionID,
      props.inviteCode,
      credential,
      undefined,
      undefined,
      undefined,
      undefined,
      code.value,
      MfaType.Email
    )
    userStore.$patch((state) => {
      state.apiKey = saveApiKey ? ret.data.apiKey : ''
      state.loginConfirmSession = ret.data.confirmSession
      state.tenant = ret.data.tenant
      state.user = ret.data.user
      state.updatedAt = Date.now()
      console.log('login success', ret.data)
    })
    if (ret.data.confirmSession) {
      console.log('confirm session', ret.data.confirmSession)
      router.push('/confirm-session')
      return
    }
    console.log('redirecting to', props.redirect ?? '/')
    if (props.redirect) {
      router.push(props.redirect)
      return
    }
    router.push('/')
  } catch (e: any) {
    console.log('login error', e)
    if (e instanceof UnauthorizedError) {
      let text =
        'You are not authorized to access. ' +
        'Please check your login credentials.'
      alert.value = {
        on: true,
        title: 'Unauthorized!',
        text: text,
        type: 'error',
      }
      return
    }
    if (e instanceof AxiosError && e.response?.status == 428) {
      const authInfo: AdditionalAuthInfo = e.response.data
      mfaNeeded.value = authInfo.authOptions
      const title = mfaNeeded.value?.includes('email')
        ? 'Email Verification Code Required'
        : mfaNeeded.value?.includes('sms')
        ? 'Mobile Verification Code Required'
        : 'Additional Authentication Required'
      alert.value = {
        on: true,
        title: title,
        type: 'info',
      }
      console.log(
        'Additional Authentication Required',
        mfaNeeded.value?.length,
        mfaNeeded.value?.includes('email')
      )
      return
    }
    let text = e.toString()
    if (e instanceof Error) {
      text = e.message
    }
    alert.value = {
      on: true,
      title: 'Error',
      text: text,
      type: 'error',
    }
  } finally {
    loading.value = false
  }
}
function changed() {
  // Only clear the alert and keep the snackbar.
  if (alert.value) {
    alert.value = { on: false }
  }
}

function emailChanged() {
  changed()
  loginType.value = undefined
  mfaNeeded.value = []
}

onMounted(() => {
  // Reset user store state when login component mounts
  userStore.$reset()
})
</script>

<template>
  <v-container>
    <v-sheet
      class="mx-auto mt-2 py-4 px-2"
      :elevation="0"
      :border="0"
      maxWidth="600"
    >
      <Alert class="mb-4" v-model="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <v-row v-if="!canLogin" justify="center">
          <v-col cols="12">
            <p class="my-4 text-body-2 text-center d-block">
              Please enter email to sign in
            </p>
          </v-col>
        </v-row>
        <EmailInput
          v-if="loginType != LoginType.Phone"
          v-model="username"
          @change="emailChanged"
          @submit="submit"
        />
        <PasswordInput
          v-if="loginType == LoginType.Username"
          v-model="password"
          autofocus
          @change="changed"
          @submit="submit"
        />

        <!-- Show appropriate MFA input when needed -->
        <template v-if="mfaNeeded?.length">
          <template v-if="mfaNeeded?.includes('email')">
            <p class="my-4 text-center d-block">
              {{ emailCodeHint }}
            </p>
            <CodeInput
              v-model:code="code"
              v-model:codeSent="codeSent"
              :email="username"
              :sendDisabled="!emailValid"
              sendTitle="Send Code to Email"
              sendAgainTitle="Send Code to Email again"
              @change="changed"
            />
          </template>
        </template>
      </v-form>
      <v-btn
        v-if="canLogin"
        block
        class="my-2"
        color="blue"
        size="large"
        variant="tonal"
        rounded="small"
        :disabled="!codeIsReady"
        :loading="loading"
        :text="signInLabel"
        @click="submit"
      >
      </v-btn>

      <v-row justify="center">
        <v-col cols="12">
          <p class="my-3 text-body-2 text-center d-block">OR</p>
        </v-col>
      </v-row>
      <GoogleSignIn
        :sessionID="sessionID"
        :inviteCode="inviteCode"
        v-model:alert="alert"
      />
      <AppleSignin
        :sessionID="sessionID"
        :inviteCode="inviteCode"
        v-model:alert="alert"
      />
      <v-row justify="center">
        <v-col cols="12">
          <p class="my-2 text-body-2 text-center d-block">
            Sign in for first time user will sign up automatically
          </p>
        </v-col>
      </v-row>
      <v-row class="mt-2" justify="center">
        <v-col cols="12">
          <p class="text-body-2 text-center d-block">
            First time user?
            <a
              variant="text"
              density="compact"
              href="https://cylonix.io"
              target="_blank"
              class="text-decoration-none px-1"
            >
              Learn more at cylonix.io
            </a>
          </p>
        </v-col>
      </v-row>

      <v-row justify="center">
        <v-col cols="12">
          <p class="text-caption text-center text-grey-darken-1 d-block">
            By continuing, you agree to our
            <router-link to="/terms-of-service" class="text-link">
              Terms of Service
            </router-link>
            and
            <router-link to="/privacy-policy" class="text-link">
              Privacy Policy
            </router-link>
          </p>
        </v-col>
      </v-row>
    </v-sheet>
    <CookiesPolicyBanner />
  </v-container>
</template>
