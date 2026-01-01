<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import isEmail from 'validator/es/lib/isEmail'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { LoginType, User, UserLogin } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { useUserStore } from '@/stores/user'

defineProps<{
  withNamespace?: boolean
  withUsername?: boolean
  mustSelectRoles?: boolean
}>()
const dialog = defineModel<boolean>()
const emit = defineEmits(['added'])

const { lgAndUp } = useDisplay()

const store = useUserStore()
const { isAdmin, isSysAdmin } = storeToRefs(store)
const defaultNamespace = computed(() => {
  if (isSysAdmin.value) {
    return 'default'
  }
  return isAdmin.value ? store.user?.namespace : undefined
})

const alert = ref<Alert>({ on: false })
const email = ref()
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const name = ref('')
const namespace = ref(defaultNamespace)
const phone = ref('')
const password = ref()
const rolesSelected = ref()
const roles = ref()
const username = ref()
const networkDomain = ref()

const ready = computed(() => {
  return (
    isFormValid.value !== false &&
    name.value !== '' &&
    username.value !== '' &&
    password.value !== '' &&
    networkDomain.value !== ''
  )
})

onMounted(async () => {
  await loadUserRoles()
})

var emailSyncFromUsername = false
watch(username, (newUsername) => {
  if (
    newUsername &&
    isEmail(newUsername) &&
    (!email.value || emailSyncFromUsername)
  ) {
    email.value = newUsername
    emailSyncFromUsername = true
  }
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
  const { valid } = await form.value!.validate()
  if (!valid) {
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await userAPI.postUser(
      <User>{
        userID: '00000000-0000-0000-0000-000000000000', // nil userID to be set by the backend
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
      <v-form
        class="mt-2"
        ref="form"
        v-model="isFormValid"
        auto-complete="add-user"
      >
        <v-row class="my-2">
          <v-col sm="12" lg="6">
            <NamespaceInput
              class="mt-2"
              v-if="withNamespace"
              v-model="namespace"
            ></NamespaceInput>
            <NameInput
              class="mt-2"
              v-model="name"
              autocomplete="name"
              label="Name (First Last)"
              required
            />
            <PhoneInput
              class="mt-2"
              v-model="phone"
              requiredMessage="Phone or email is required"
              :required="phoneRequired"
            />
            <EmailInput
              class="mt-2"
              v-model="email"
              requiredMessage="Phone or email is required"
              :required="emailRequired"
            />
          </v-col>
          <v-col sm="12" lg="6">
            <UsernameInput
              class="mt-2"
              v-if="withUsername"
              v-model="username"
            />
            <PasswordWithConfirmationInput class="mt-2" v-model="password" />
            <RolesSelect
              class="mt-2"
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
