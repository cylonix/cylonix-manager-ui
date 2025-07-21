<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { useUserStore } from '@/stores/user'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'generated'])
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const alert = ref<Alert>()
const loading = ref(false)
const description = ref('')
const reusable = ref(false)
const expirationDays = ref(90)
const isEphemeral = ref(false)
const tags = ref('')
const generatedKey = ref('')
const showGeneratedKey = ref(false)
const { user } = storeToRefs(useUserStore())

const rules = {
  expiration: [
    (v: number) => v >= 1 || 'Minimum 1 day',
    (v: number) => v <= 90 || 'Maximum 90 days',
  ],
}

// Watch for dialog opening
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    console.log('Dialog opened, resetting state')
    showGeneratedKey.value = false
    reusable.value = false
    tags.value = ''
    alert.value = { on: false }
  }
})

const expirationDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + expirationDays.value)
  return date.toISOString() // Returns RFC3339 format like "2025-10-19T15:00:00.000Z"
})

const displayExpirationDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + expirationDays.value)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})
async function generate() {
  const uid = user.value?.userID
  if (!uid) {
    alert.value = { on: true, text: 'User not found. Please log in again.' }
    return
  }
  loading.value = true
  const ret = await tryRequest(async () => {
    const resp = await vpnAPI.headscaleServiceCreatePreAuthKey({
      user: uid,
      description: description.value,
      reusable: reusable.value,
      expiration: expirationDate.value,
      ephemeral: isEphemeral.value,
      aclTags: tags.value ? tags.value.split(',').map((tag) => tag.trim()) : [],
    })
    emit('generated')
    // Mock response for now
    generatedKey.value = resp.data.preAuthKey?.key ?? 'invalid-key'
    showGeneratedKey.value = true
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
function copyKey() {
  navigator.clipboard.writeText(generatedKey.value)
}
function done() {
  dialog.value = false
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="600" persistent>
    <v-card>
      <template v-if="!showGeneratedKey">
        <v-card-title>Generate Auth Key</v-card-title>
        <v-card-text>
          <Alert v-model="alert" />
          <v-form @submit.prevent="generate">
            <!-- Description -->
            <h3>Description</h3>
            <p>Add a description to help identify this key</p>
            <v-text-field
              v-model="description"
              label="Description (Optional)"
              clearable
            />

            <!-- Reusable Option -->
            <h3>Reusable</h3>
            <p>
              A resuable key can be used to authenticate multiple devices. If
              unchecked, the key will be single-use.
            </p>
            <v-switch v-model="reusable" label="Reusable Key" persistent-hint />

            <!-- Expiration Days -->
            <h3>Expiration</h3>
            <p>Set the number of days before this key expires.</p>
            <p>Minimum 1 day, maximum 90 days.</p>
            <v-text-field
              v-model="expirationDays"
              label="Expiration (days)"
              type="number"
              :rules="rules.expiration"
              :min="1"
              :max="90"
            />

            <!-- Device Settings -->
            <v-card variant="tonal" class="mt-4 pa-4">
              <v-card-title class="text-subtitle-1"
                >Device Settings (Optional)</v-card-title
              >

              <!-- Ephemeral Option -->
              <v-switch
                v-model="isEphemeral"
                label="Ephemeral Device"
                hint="Devices authenticated by this key will be automatically removed after going offline"
                persistent-hint
                class="mt-2"
              />

              <!-- Tags -->
              <v-text-field
                v-model="tags"
                label="Tags"
                hint="Devices authenticated by this key will be automatically tagged (disables node key expiry)"
                persistent-hint
                clearable
                class="mt-2"
              />
            </v-card>
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
            class="me-2"
            color="primary"
            @click="generate"
            :loading="loading"
            :disabled="loading"
          >
            Generate
          </v-btn>
        </v-card-actions>
      </template>
      <template v-else>
        <v-card-title>Auth Key Generated</v-card-title>
        <v-card-text>
          <Alert v-model="alert" />
          <p class="mt-2 mb-4">
            Be sure to copy your new key below. It won't be shown in full again.
          </p>

          <v-sheet class="pa-4 mb-4" color="grey-lighten-3" rounded>
            <div class="d-flex align-center">
              <code class="text-body-1 flex-grow-1">{{ generatedKey }}</code>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                @click="copyKey"
              ></v-btn>
            </div>
          </v-sheet>

          <p class="mt-2 text-body-2">
            This key will expire on {{ displayExpirationDate }}. If you'll then
            want to continue using an auth key, please generate a new one.
          </p>
        </v-card-text>

        <v-card-actions>
          <v-btn class="me-2" color="primary" @click="done"> Done </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-switch {
  margin-top: 20px;
}
code {
  word-break: break-all;
}
</style>
