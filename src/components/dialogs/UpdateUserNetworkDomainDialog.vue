<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { User } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const emit = defineEmits(['updated'])
const props = defineProps<{ user?: User }>()
const dialog = defineModel<boolean>()

const alert = ref<Alert>({ on: false })
const loading = ref(false)
const networkDomain = ref('')
const generating = ref(false)
const useWords = ref(false)

const ready = computed(() => {
  const t = props.user
  return t && networkDomain.value
})

// Update initial values when prop changes.
watchEffect(() => {
  const t = props.user
  networkDomain.value = t?.networkDomain ?? ''
})

const buttonText = computed(() => {
  return networkDomain.value ? 'Get a new domain' : 'Get a domain'
})

const caption = computed(() => {
  return `Update user "${props.user?.displayName}"'s network domain to `
})

async function generateNetworkDomain() {
  generating.value = true
  const ret = await tryRequest(async () => {
    const response = await userAPI.generateNetworkDomain(useWords.value)
    networkDomain.value = response.data
    newToast({
      on: true,
      color: 'info',
      text: `Generated new ${
        useWords.value ? 'word-based' : 'digit-based'
      } domain`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  generating.value = false
}

async function update() {
  const ret = await tryRequest(async () => {
    const t = props.user
    if (!t) {
      return
    }
    loading.value = true
    await userAPI.setNetworkDomain(t.userID, networkDomain.value)
    newToast({
      on: true,
      color: 'green',
      text: `User network domain updated to ${networkDomain.value}.`,
    })
    emit('updated')
    dialog.value = false
  })
  if (ret) {
    alert.value = ret
  }
  console.log(`Done updating user's network domain to ${networkDomain.value}`)
  loading.value = false
}
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    max-width="600"
    min-width="400"
    :okDisabled="!ready"
    okText="Submit"
    title="Update User Network Domain"
    @ok="update"
  >
    <template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-card-text class="text-center" v-if="user?.networkDomain">
        <span class="text-h6">Current network domain:</span>
        <span class="text-h6 font-weight-bold">
          {{ user?.networkDomain }}
        </span>
      </v-card-text>
      <v-card-text class="text-center" v-if="networkDomain">
        <p class="text-h6">{{ caption }}</p>
        <p class="text-h6 font-weight-bold">
          {{ networkDomain }}
        </p>
      </v-card-text>
      <v-row justify="center" class="mx-3 mt-3">
        <v-btn
          variant="text"
          :loading="generating"
          :disabled="generating"
          @click="generateNetworkDomain"
          :text="buttonText"
        ></v-btn>
      </v-row>
      <v-row justify="center" class="mx-3 mb-3">
        <v-checkbox
          v-model="useWords"
          label="Use random words"
          density="compact"
          hide-details
        ></v-checkbox>
      </v-row>
    </template>
  </ConfirmDialog>
</template>
