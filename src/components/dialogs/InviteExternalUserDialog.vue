<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'invited'])

const alert = ref<Alert>()
const loading = ref(false)
const emails = ref('')
const role = ref('member')
const inviteLink = ref('')
const showLink = ref(false)

const roles = [
  { title: 'Network Admin', value: 'network_admin' },
  { title: 'Member', value: 'member' },
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

async function generateInviteLink() {
  if (!isValid.value) return

  loading.value = true
  const ret = await tryRequest(async () => {
    const resp = await userAPI.inviteUser({
      emails: emailList.value,
      sendEmail: false,
      internalUser: false,
    })
    inviteLink.value = resp.data
    showLink.value = true
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

async function sendInvites() {
  if (!isValid.value) return

  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.inviteUser({
      emails: emailList.value,
      sendEmail: true,
      internalUser: false,
    })
    emit('invited')
    dialog.value = false
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function copyLink() {
  navigator.clipboard.writeText(inviteLink.value)
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600">
    <v-card>
      <v-card-title>Invite External Users</v-card-title>
      <v-card-text>
        <Alert v-model="alert" />

        <p class="text-body-1 mb-4">
          Invite users to join this Cylonix network and access its machines, as
          allowed by ACLs. If you only want to give a user access to one
          machine, share the machine instead.
        </p>

        <v-form @submit.prevent="sendInvites">
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

          <v-sheet
            v-if="showLink"
            class="mt-4 pa-4"
            color="grey-lighten-3"
            rounded
          >
            <div class="d-flex align-center">
              <code class="text-body-2 flex-grow-1">{{ inviteLink }}</code>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                @click="copyLink"
              ></v-btn>
            </div>
          </v-sheet>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn
          color="grey"
          variant="text"
          @click="dialog = false"
          :disabled="loading"
        >
          Cancel
        </v-btn>
        <v-btn
          v-if="!showLink"
          color="secondary"
          @click="generateInviteLink"
          :loading="loading"
          :disabled="loading || !isValid || !emails"
        >
          Get Invite Link
        </v-btn>
        <v-btn
          color="primary"
          @click="sendInvites"
          :loading="loading"
          :disabled="loading || !isValid || !emails"
        >
          Send Invite
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
code {
  word-break: break-all;
}
</style>
