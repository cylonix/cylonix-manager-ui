<script setup lang="ts">
import { computed, ref } from 'vue'
import { VForm } from 'vuetify/components'
import { TenantConfig } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tenantAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const password = defineModel<string>("password")

const alert = ref<Alert>({ on: false })
const email = ref('')
const namespace = ref('')
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const name = ref('')
const phone = ref('')

const ready = computed(() => {
  return isFormValid.value
})

async function add() {
  const ret = await tryRequest(async () => {
    loading.value = true
    const ret = await tenantAPI.addTenantConfig(<TenantConfig>{
      name: name.value,
      namespace: namespace.value,
      email: email.value,
      phone: phone.value,
    })
    password.value = ret.data
    newToast({
      on: true,
      color: 'green',
      text: `Added tenant ${name.value} successfully.`,
    })
    // Remove dialog after success.
    dialog.value = false
    emit('added')
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    minWidth="400"
    :okDisabled="!ready"
    okText="Add"
    title="Add tenant"
    @ok="add"
    ><template v-slot:item>
      <Alert v-if="alert.on" :alert="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <CompanyNameInput v-model="name" check-available></CompanyNameInput>
        <NamespaceInput v-model="namespace" check-available></NamespaceInput>
        <EmailInput v-model="email"></EmailInput>
        <PhoneInput v-model="phone"></PhoneInput>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
