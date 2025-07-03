<script setup lang="ts">
import { ref } from 'vue'

defineProps(['emailUsername', 'limitAttempts'])
const emit = defineEmits(['change'])
const namespace = defineModel<string>('namespace')
const namespaceType = defineModel<string>('namespaceType')
const username = defineModel<string>('username')
const password = defineModel<string>('password')
const forgetPasswordDialog = ref<boolean>(false)
</script>
<template>
  <EmailInput
    v-if="emailUsername"
    v-model="username"
    @change="emit('change')"
  />
  <UsernameInput
    v-if="!emailUsername"
    v-model="username"
    @change="emit('change')"
  />
  <PasswordInput v-model="password" @change="emit('change')" />
  <v-card
    v-if="limitAttempts"
    class="mb-2"
    color="surface-variant"
    variant="tonal"
  >
    <v-card-text class="text-medium-emphasis text-caption">
      Warning: After 3 consecutive failed login attempts, you account will be
      temporarily locked for three hours. If you must login now, you can also
      click "Forgot login password?" below to reset the login password.
    </v-card-text>
  </v-card>
  <div class="d-flex justify-end">
    <v-chip size="small" variant="plain" @click="forgetPasswordDialog = true"
      >Forgot login password?</v-chip
    >
  </div>
  <ForgetPasswordDialog
    v-model="forgetPasswordDialog"
    v-model:namespace="namespace"
    v-model:namespaceType="namespaceType"
  ></ForgetPasswordDialog>
</template>
