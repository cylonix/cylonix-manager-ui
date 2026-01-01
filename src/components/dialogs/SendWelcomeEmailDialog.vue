<script setup lang="ts">
import { ref, computed } from 'vue'
import { PredefinedRoles } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const props = defineProps<{
  modelValue: boolean
  organization: string
}>()

const emit = defineEmits(['update:modelValue', 'sent'])

const alert = ref<Alert>()
const loading = ref(false)
const emails = ref('')
const role = ref<PredefinedRoles>(PredefinedRoles.Member)

const roles = [
  { title: 'Network Admin', value: PredefinedRoles.NetworkAdmin },
  { title: 'Member', value: PredefinedRoles.Member },
]

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const emailList = computed(() => {
  return emails.value
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
})

const isValid = computed(() => {
  return emailList.value.every((email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  })
})

async function sendInvites() {
  if (!isValid.value) return

  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.inviteUser({
      emails: emailList.value,
      sendEmail: true,
      internalUser: true,
      role: role.value,
    })
    emit('sent')
    dialog.value = false
    newToast({
      on: true,
      color: 'green',
      text: `Welcome email sent to ${emailList.value.join(', ')}`,
    })
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title>Send Welcome Email</v-card-title>
      <v-card-text>
        <Alert v-model="alert" />

        <p class="text-body-1 mb-4">
          Send your team members a welcome email. It will include a link to
          downloading Cylonix, and instructions for joining the Cylonix network
          using their {{ organization }} email.
        </p>

        <v-form class="mt-2" @submit.prevent="sendInvites">
          <v-text-field
            v-model="emails"
            label="Email Addresses"
            placeholder="Enter email addresses separated by commas"
            :error-messages="
              !isValid && emails ? 'Please enter valid email addresses' : ''
            "
            hint="Enter multiple emails separated by commas"
            persistent-hint
          />

          <v-select v-model="role" :items="roles" label="Role" class="mt-4" />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="dialog = false"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="sendInvites"
          :loading="loading"
          :disabled="loading || !isValid || !emails"
        >
          Send Welcome Email
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
