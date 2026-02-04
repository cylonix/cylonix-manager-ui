<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { mdiChevronRight } from '@mdi/js'
import { VForm } from 'vuetify/components'

const code = ref()
const codeSent = ref(false)
const email = ref()
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const password = ref()
const terms = ref(false)

const ready = computed(() => {
  return isFormValid.value
})

async function signUp() {
  if (form.value) {
    const valid = await form.value.validate()
    if (!valid) {
      return
    }
  }
  // Submit the sign-up data
}
</script>
<template>
  <v-sheet class="mx-auto px-2 py-2" max-width="1000">
    <v-form ref="form" v-model="isFormValid" auto-complete="on">
      <UserSignUpInput
        v-model:code="code"
        v-model:codeSent="codeSent"
        v-model:email="email"
        v-model:password="password"
        withCode
        withEmail
        withPassword
      />
      <v-divider></v-divider>
      <TermsSelect class="my-6" v-model="terms" />
    </v-form>
    <v-row class="my-6" justify="end">
      <v-btn
        :disabled="!ready"
        class="mx-2"
        color="success"
        variant="tonal"
        @click="signUp"
      >
        Submit Registration
        <v-icon :icon="mdiChevronRight" end></v-icon>
      </v-btn>
    </v-row>
  </v-sheet>
</template>
