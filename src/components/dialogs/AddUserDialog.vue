<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { LoginType, User, UserLogin } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

defineProps<{
  withNamespace?: boolean
  withUsername?: boolean
  mustSelectRoles?: boolean
}>()
const dialog = defineModel<boolean>()
const emit = defineEmits(['added'])

const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const email = ref()
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const name = ref('')
const namespace = ref()
const phone = ref('')
const password = ref()
const rolesSelected = ref()
const roles = ref()
const username = ref()
const userID = ref()
const networkDomain = ref()

const ready = computed(() => {
  return isFormValid.value
})

onMounted(async () => {
  await loadUserRoles()
})

async function loadUserRoles() {
  loading.value = true
  const ret = await tryRequest(async () => {
    const ret = await userAPI.getUserRoles()
    roles.value = ret?.data
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

async function addUser() {
  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.postUser(
      <User>{
        userID: userID.value,
        networkDomain: networkDomain.value,
        displayName: name.value,
        email: email.value,
        phone: phone.value,
        roles: rolesSelected.value,
        logins: [
          <UserLogin>{
            loginType: LoginType.Username,
            login: username.value,
            credential: password.value,
            displayName: name.value,
          },
        ],
      },
      namespace.value
    )
    emit('added')
    newToast({
      on: true,
      color: 'green',
      text: `Added user ${username.value} successfully.`,
    })
    dialog.value = false
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
const emailRequired = computed(() => {
  return !phone.value
})
const phoneRequired = computed(() => {
  return !email.value
})
</script>
<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    maxWidth="1000"
    :minWidth="lgAndUp ? '900' : '400'"
    :okDisabled="!ready"
    okText="Add"
    title="Add user"
    @ok="addUser"
    ><template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="add-user">
        <v-row>
          <v-col sm="12" lg="6">
            <NamespaceInput
              v-if="withNamespace"
              v-model="namespace"
            ></NamespaceInput>
            <NameInput
              v-model="name"
              autocomplete="name"
              label="Name (First Last)"
              required
            />
            <PhoneInput
              v-model="phone"
              requiredMessage="Phone or email is required"
              :required="phoneRequired"
            />
            <EmailInput
              v-model="email"
              requiredMessage="Phone or email is required"
              :required="emailRequired"
            />
            <NameInput v-model="userID" min="36" max="36" label="User ID" />
          </v-col>
          <v-col sm="12" lg="6">
            <UsernameInput v-if="withUsername" v-model="username" />
            <PasswordWithConfirmationInput v-model="password" />
            <RolesSelect
              v-model="rolesSelected"
              title="Select user roles"
              :loading="loading"
              :required="mustSelectRoles"
              :roles="roles"
              @refresh="loadUserRoles"
            />
            <NameInput v-model="networkDomain" min="8" label="Network Domain" />
          </v-col>
        </v-row>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
