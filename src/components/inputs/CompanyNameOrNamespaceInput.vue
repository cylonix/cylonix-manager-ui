<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
import type { Alert } from '@/plugins/alert'
import { tenantAPI, tryRequest } from '@/plugins/api'

const props = defineProps<{
  checkAvailable?: boolean
  checkTooltip?: string
  label?: string
  max?: number
  min?: number
}>()
const emit = defineEmits(['change'])
const name = defineModel<string>()

const alert = ref<Alert>({ on: false })
const available = ref()
const loading = ref(false)

function updated() {
  emit('change')
}

async function checkNameAvailable() {
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await tenantAPI.checkNamespace(undefined, name.value)
    available.value = ret.data
    if (!available.value) {
      alert.value = {
        on: true,
        text: `${props.label} ${name.value} is not available.`,
      }
    }
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>
<template>
  <AbstractNameInput
    v-model="name"
    v-model:alert="alert"
    v-model:checkSuccess="available"
    :input-props="{
      autocomplete: 'organization',
      clearable: true,
      density: 'compact',
      loading: loading,
      prependInnerIcon: 'mdi-domain',
    }"
    :check="checkAvailable"
    :check-tooltip="checkTooltip"
    :label="label"
    :max="max"
    :min="min"
    required
    @change="updated"
    @check="checkNameAvailable"
  >
  </AbstractNameInput>
</template>
