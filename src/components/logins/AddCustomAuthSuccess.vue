<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
import { mdiOpenid } from '@mdi/js'
import { storeToRefs } from 'pinia'
import { useLoginStore } from '@/stores/login'
import { shortString } from '@/plugins/utils'

const loginStore = useLoginStore()
const { oauthProvider } = storeToRefs(loginStore)

const providerTable = computed(() => {
  if (!oauthProvider.value) {
    return []
  }
  const a = oauthProvider.value
  return [
    { name: 'Domain', value: a.domain },
    { name: 'Admin Email', value: a.adminEmail },
    { name: 'Provider', value: a.provider },
    { name: 'Client ID', value: a.clientID },
    { name: 'Client Secret', value: shortString(a.clientSecret) },
  ]
})
</script>
<template>
  <v-container>
    <p class="text-h5">
      <v-icon class="me-2" :icon="mdiOpenid"></v-icon>Custom OIDC added
      successfully
    </p>

    <p class="my-4">
      The custom OIDC provider for domain
      <strong>{{ oauthProvider?.domain }}</strong> has been added successfully.
    </p>
    <p class="my-4">
      You can now use this provider for authentication by directly entering the
      email with the domain you have configured.
    </p>
    <v-card>
      <v-card-text>
        <v-table>
          <tbody>
            <tr v-for="item in providerTable" :key="item.name">
              <td>{{ item.name }}</td>
              <td>{{ item.value }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>
