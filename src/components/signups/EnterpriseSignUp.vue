<script setup lang="ts">
import { computed, ref } from 'vue'
import { VForm } from 'vuetify/components'
import { TenantApproval } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tenantAPI, tryRequest } from '@/plugins/api'

const alert = ref<Alert>({ on: false })
const companyName = ref()
const code = ref()
const codeSent = ref(false)
const email = ref()
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const name = ref()
const phone = ref()
const terms = ref(false)

const ready = computed(() => {
  return (
    isFormValid.value &&
    (email.value || phone.value) &&
    code.value &&
    terms.value
  )
})

async function signUp() {
  const ret = await tryRequest(async () => {
    await tenantAPI.registerTenant(<TenantApproval>{
      companyName: companyName.value,
      id: '', // Assign by backend
      namespace: '', // Assign by admin
      username: email.value,
      password: '', // Temporary first password will be generated
      email: email.value,
      phone: phone.value,
      code: code.value,
      contactName: name.value,
    })
    alert.value = {
      on: true,
      text:
        'Registration submitted successfully. After processing, the ' +
        `administrator login information will be sent to ${email.value}.`,
      type: 'success',
    }
    form.value?.reset()
  })
  if (ret) {
    alert.value = ret
  }
  codeSent.value = false
  code.value = ''
}
</script>
<template>
  <v-sheet class="mx-auto px-2 py-2" max-width="700">
    <Alert v-model="alert"></Alert>
    <v-form ref="form" v-model="isFormValid" autocomplete="on">
      <NameInput v-model="companyName" label="Company Name" required />
      <UserSignUpInput
        v-model:code="code"
        v-model:codeSent="codeSent"
        v-model:email="email"
        v-model:name="name"
        v-model:phone="phone"
        withCode
        withEmail
        withPhone
      />
      <v-divider></v-divider>
      <TermsSelect class="my-6" v-model="terms" />
    </v-form>
    <v-row class="mx-2 my-6" justify="end">
      <v-btn :disabled="!ready" color="success" variant="tonal" @click="signUp">
        Submit Registration
        <v-icon icon="mdi-chevron-right" end></v-icon>
      </v-btn>
    </v-row>
  </v-sheet>
</template>
