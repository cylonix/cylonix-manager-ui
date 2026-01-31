<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import type { Alert } from '@/plugins/alert'
import { VForm } from 'vuetify/components'
import isEmail from 'validator/es/lib/isEmail'
import { tryDecodeError, tryRequest, loginAPI } from '@/plugins/api'
import { useLoginStore } from '@/stores/login'
import getEnv from '@/utils/env'

const alert = ref<Alert>({ on: false })
const loading = ref(false)
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const email = ref('')
const clientID = ref('')
const clientSecret = ref('')

const loginStore = useLoginStore()
const urlShown = ref(false)
const webFingerURL = computed(() => {
  if (urlShown.value === false) {
    return '<WebFinger URL hidden>'
  }
  var domain = '<your domain>'
  var account = '<your email>'
  if (isEmail(email.value)) {
    domain = email.value.split('@')[1] ?? ''
    account = email.value
  }
  return `https://${domain}/.well-known/webfinger?resource=acct:${account}`
})

const { smAndUp, mdAndUp } = useDisplay()
const callBackURL = computed(() => {
  return `${window.location.origin}/manager/v2/login/oauth/callback`
})

const showURL = computed(() => {
  if (urlShown.value) {
    return 'Hide'
  } else {
    return 'Show'
  }
})

const redirectConfirmDialog = ref(false)
const redirectURL = ref('')
function redirect() {
  redirectConfirmDialog.value = false
  window.location.href = redirectURL.value
}

async function submit() {
  const { valid } = await form.value!.validate()
  if (!valid) {
    alert.value = {
      on: true,
      type: 'error',
      text: 'Please fill in all required fields correctly.',
    }
    return
  }
  console.log('form is valid')

  loading.value = true
  const redirect =
    getEnv('VITE_LOGIN_REDIRECT_BASE_URL') +
    '/' +
    `?redirect=/add-custom-auth-success`
  const ret = await tryRequest(async () => {
    const authProvider = {
      domain: email.value.split('@')[1] ?? '',
      webFingerURL: webFingerURL.value,
      adminEmail: email.value,
      clientID: clientID.value,
      clientSecret: clientSecret.value,
      provider: selectedProviderName.value,
    }
    const result = await loginAPI.addOauthProvider(authProvider, redirect)
    if (!result.data) {
      throw new Error('No data returned from server')
    }
    loginStore.$patch((state) => {
      state.oauthProvider = authProvider
    })

    redirectURL.value = result.data
    console.log('result URL:', redirectURL.value)
    // Show the redirect confirmation dialog to finish the OIDC verification and setup.
    redirectConfirmDialog.value = true
  })
  if (ret) {
    const badReq = tryDecodeError(ret.text)
    if (badReq && badReq.errorMessage) {
      alert.value = {
        on: true,
        type: 'error',
        text: `Parameter error: ${badReq.errorMessage}`,
      }
      loading.value = false
      return
    } else {
      alert.value = ret
    }
  }

  loading.value = false
}

function change() {
  alert.value = { on: false }
}

const provider = ref('')
const customProvider = ref('')
const providerOptions = [
  { value: 'auth0', text: 'Auth0', link: 'https://auth0.com/docs/get-started' },
  {
    value: 'authelia',
    text: 'Authelia',
    link: '',
    note:
      'Authelia is a self-hosted OIDC provider. ' +
      'Make sure your Authelia instance is properly configured.',
  },
  {
    value: 'authentik',
    text: 'Authentik',
    link: 'https://docs.goauthentik.io/add-secure-apps/providers/oauth2/',
  },
  {
    value: 'azure',
    text: 'Azure AD',
    link:
      'https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow',
  },
  {
    value: 'codeberg',
    text: 'Codeberg',
    link:
      'https://docs.codeberg.org/integrations/keycloak/#set-up-an-oauth2-application-on-codeberg',
  },
  {
    value: 'cognito',
    text: 'AWS Cognito',
    link:
      'https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-oidc-flow.html',
  },
  {
    value: 'dex',
    text: 'Dex',
    link: 'https://dexidp.io/docs/connectors/oidc/',
  },
  { value: 'duo', text: 'Duo', link: 'https://duo.com/docs/oauthapi' },
  {
    value: 'foxids',
    text: 'FoxIDs',
    link: 'https://www.foxids.com/en-gb/docs/app-reg-oauth-2.0',
  },
  {
    value: 'gitea',
    text: 'Gitea',
    link: 'https://docs.gitea.com/development/oauth2-provider',
  },
  {
    value: 'gitlab',
    text: 'GitLab',
    link: 'https://docs.gitlab.com/integration/openid_connect_provider/',
  },
  {
    value: 'gitlab_self_managed',
    text: 'GitLab self-managed',
    link: 'https://docs.gitlab.com/integration/openid_connect_provider/',
  },
  {
    value: 'jump_cloud',
    text: 'JumpCloud',
    link: 'https://jumpcloud.com/support/sso-with-oidc',
  },
  {
    value: 'keycloak',
    text: 'Keycloak',
    link: 'https://www.keycloak.org/documentation',
  },
  {
    value: 'okta',
    text: 'Okta',
    link:
      'https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/',
  },
  {
    value: 'ory_network',
    text: 'Ory Network',
    link: 'https://www.ory.sh/docs/next/kratos/',
  },
  {
    value: 'ory_self_hosted',
    text: 'Ory self-hosted',
    link: 'https://www.ory.sh/docs/next/hydra/',
  },
  {
    value: 'ping_identity',
    text: 'Ping Identity',
    link:
      'https://docs.pingidentity.com/bundle/pingid/page/ydf1564003024501.html',
  },
  {
    value: 'pocket_id',
    text: 'Pocket ID',
    link: 'https://github.com/pocket-id/pocket-id',
  },
  {
    value: 'zitadel_cloud',
    text: 'ZITADEL Cloud',
    link: 'https://docs.zitadel.com/docs/getting-started/',
  },
  {
    value: 'zitadel_open_source',
    text: 'ZITADEL Open Source',
    link: 'https://docs.zitadel.com/docs/getting-started/',
  },
  {
    value: 'zoho',
    text: 'Zoho',
    link:
      'https://www.zoho.com/accounts/protocol/oauth/sign-in-using-zoho.html',
  },
  { value: 'other', text: 'Other', note: 'Specify your custom OIDC provider.' },
]

const selectedProviderName = computed(() => {
  const option = providerOptions.find((p) => p.value === provider.value)
  if (provider.value === 'other' && customProvider.value) {
    return `Other: ${customProvider.value}`
  }
  return option ? option.text : ''
})

const providerNote = computed(() => {
  const option = providerOptions.find((p) => p.value === provider.value)
  return option ? option.note : ''
})

const providerLink = computed(() => {
  const option = providerOptions.find((p) => p.value === provider.value)
  return option ? option.link : ''
})

function goBack() {
  window.history.back()
}
</script>
<template>
  <v-container>
    <v-row class="my-4">
      <v-col align="start">
        <v-chip color="primary" variant="text" @click="goBack"
          ><v-icon class="mr-2">mdi-arrow-left</v-icon>Back to sign in</v-chip
        >
      </v-col>
    </v-row>
    <v-row class="mx-2" justify="center" align="center">
      <v-icon class="me-2">mdi-openid</v-icon
      ><span class="my-4 text-h5">
        Add a custom OIDC sign-in for your domain
      </span>
    </v-row>
    <Alert class="mb-4" v-model="alert"></Alert>
    <p class="my-4 text-body-1">
      Please enter the custom OIDC provider information for your domain. Cylonix
      will use the following WebFinger URL to discover the OIDC issuer
      information and validate your domain ownership:
      <span class="font-weight-bold"
        ><code>{{ webFingerURL }}</code></span
      ><v-chip variant="plain" @click="urlShown = !urlShown">{{
        showURL
      }}</v-chip>
    </p>
    <v-row>
      <v-col cols="12" lg="4" xl="8">
        <p class="my-4 text-body-1 font-weight-light">
          The email is used to construct the WebFinger URL for OIDC discovery.
          It will also be used to sign up with Cylonix and assume the ownership
          and administrative role of this domain.
        </p>
        <p class="mt-6 mb-4 text-body-1 font-weight-light">
          The Client ID and Client Secret are provided by your OIDC provider.
          For detailed instructions on obtaining these credentials, please refer
          to your OIDC provider's documentation. Please make sure to add the
          following to the allowed redirect URIs:
        </p>
        <p>
          <span class="font-weight-bold text-break"
            ><code>
              {{ callBackURL }}
            </code></span
          ><CopyButton :text="callBackURL" show-toast />
        </p>
      </v-col>
      <v-col class="d-flex justify-center" cols="12" lg="8" xl="4">
        <v-sheet
          class="ml-2 mt-2 py-4 px-4"
          :elevation="1"
          rounded
          :min-width="mdAndUp ? '600' : smAndUp ? '500' : '100%'"
          max-width="600"
        >
          <v-form ref="form" v-model="isFormValid" auto-complete="on">
            <EmailInput
              class="mb-4"
              v-model="email"
              @submit="submit"
              @change="change"
              required
            />
            <NameInput
              v-model="clientID"
              label="OIDC Client ID"
              hint="Enter the client ID from your OIDC provider"
              required
              :min="10"
              :max="256"
              @change="change"
              @submit="submit"
            />
            <NameInput
              class="mb-4"
              v-model="clientSecret"
              label="OIDC Client Secret"
              hint="Enter the client secret from your OIDC provider"
              required
              :min="10"
              :max="256"
              @change="change"
              @submit="submit"
            />
            <v-select
              v-model="provider"
              :items="providerOptions"
              item-title="text"
              item-value="value"
              label="OIDC Provider (Optional)"
              hint="Select your OIDC provider for setup guidance"
              persistent-hint
              clearable
              density="compact"
              class="mb-2"
            ></v-select>
            <NameInput
              v-if="provider === 'other'"
              v-model="customProvider"
              label="OIDC Provider name"
              hint="Enter your custom OIDC provider name"
              class="mb-2"
              :min="5"
              :max="64"
            ></NameInput>
            <p v-if="providerNote" class="ml-4 text-body-2 text-info mb-4">
              {{ providerNote }}
            </p>
            <p v-if="providerLink" class="ml-4 text-body-2 mb-4">
              More information:
              <a
                :href="providerLink"
                target="_blank"
                rel="noopener noreferrer"
                >{{ providerLink }}</a
              >
            </p>
          </v-form>
          <v-row justify="end"
            ><v-btn class="my-4 mx-4" rounded="small" @click="submit"
              >Submit</v-btn
            ></v-row
          >
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
  <ConfirmDialog
    v-model="redirectConfirmDialog"
    max-width="600"
    title="Redirecting to the OIDC provider..."
    text="You will be redirected shortly to the OIDC provider to verify
    your account and upon successful verification, the custom OIDC sign-in
    will be added to your Cylonix instance."
    okText="Redirect"
    @ok="redirect"
  ></ConfirmDialog>
</template>
