<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { V1Node } from '@/clients/headscale/api'
import { UserInvite } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { shortTs } from '@/plugins/date'
import ConfirmDialog from './ConfirmDialog.vue'

const props = defineProps<{
  modelValue: boolean
  node: V1Node | null
}>()

const emit = defineEmits(['update:modelValue', 'shared'])

const alert = ref<Alert>()
const loading = ref(false)
const invitesLoading = ref(false)
const emails = ref('')
const inviteLink = ref('')
const currentInvites = ref<UserInvite[]>([])
const tab = ref<'email' | 'link'>('email')
const showConfirmDialog = ref(false)
const showDeleteConfirm = ref(false)
const showResendConfirm = ref(false)
const selectedInvite = ref<UserInvite | null>(null)

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

// Watch dialog to load invites when opened
watch(dialog, async (newVal) => {
  if (newVal && props.node?.id) {
    await loadCurrentInvites()
  }
})

async function loadCurrentInvites() {
  if (!props.node?.id) return

  invitesLoading.value = true
  const ret = await tryRequest(async () => {
    // Fetch invites filtered by the share node ID
    const resp = await userAPI.getUserInviteList(
      undefined, // namespace
      Number(props.node!.id!) // node ID converted to number
    )
    currentInvites.value = resp.data.items ?? []
  })
  if (ret) {
    alert.value = ret
  }
  invitesLoading.value = false
}

async function generateInviteLink() {
  if (!isValid.value || !props.node?.id) return

  loading.value = true
  const ret = await tryRequest(async () => {
    const resp = await userAPI.inviteUser({
      emails: emailList.value,
      sendEmail: false,
      internalUser: false,
      shareNode: Number(props.node!.id!), // Convert string ID to number
      shareNodeName: props.node?.givenName,
      role: 'member',
    })
    inviteLink.value = resp.data
    newToast({
      on: true,
      color: 'green',
      text: 'Invite link generated',
    })
    await loadCurrentInvites()
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

async function sendInvites() {
  if (!isValid.value || !props.node?.id) return

  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.inviteUser({
      emails: emailList.value,
      sendEmail: true,
      internalUser: false,
      shareNode: Number(props.node!.id!), // Convert string ID to number
      shareNodeName: props.node?.givenName,
      role: 'member',
    })
    emit('shared')
    newToast({
      on: true,
      color: 'green',
      text: `Invitation sent to ${emailList.value.join(', ')}`,
    })
    emails.value = ''
    showConfirmDialog.value = false
    await loadCurrentInvites()
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function copyLink() {
  navigator.clipboard.writeText(inviteLink.value)
  newToast({
    on: true,
    color: 'info',
    text: 'Link copied to clipboard',
  })
}

function confirmShare() {
  showConfirmDialog.value = true
}

function confirmDeleteInvite(invite: UserInvite) {
  selectedInvite.value = invite
  showDeleteConfirm.value = true
}

async function deleteInvite() {
  if (!selectedInvite.value?.id) return

  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.deleteUserInvite(
      [selectedInvite.value!.id],
      true /* revoke sharing */
    )
    newToast({
      on: true,
      color: 'success',
      text: 'Invite deleted successfully',
    })
    await loadCurrentInvites()
  })
  showDeleteConfirm.value = false
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function confirmResendInvite(invite: UserInvite) {
  selectedInvite.value = invite
  showResendConfirm.value = true
}

async function resendInvite() {
  if (!selectedInvite.value || !props.node?.id) return

  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.sendUserInvite(selectedInvite.value!.id)
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

function copyInviteLink(invite: UserInvite) {
  if (invite.link) {
    navigator.clipboard.writeText(invite.link)
    newToast({
      on: true,
      color: 'info',
      text: 'Invite link copied to clipboard',
    })
  }
}

const deleteConfirmationText = () => {
  return (
    'Are you sure you want to delete the invite for ' +
    `"${selectedInvite.value?.emails.join(', ')}"` +
    '? This node will also be removed from sharing to ' +
    `${
      (selectedInvite.value?.emails.length ?? 0) > 1
        ? 'these users. '
        : 'this user. '
    }  ` +
    'This action cannot be undone.'
  )
}
</script>

<template>
  <v-dialog v-model="dialog" max-width="800" scrollable>
    <v-card>
      <v-card-title class="ms-2">Share Node</v-card-title>
      <v-card-text>
        <Alert v-model="alert" />

        <!-- Section 1: Description -->
        <v-alert type="info" class="mt-2 mb-4">
          <p class="text-body-2">
            Share access to <strong>{{ node?.givenName }}</strong> with external
            users, as allowed by ACLs. If you need multiple users in the same
            cylonix network to access it, or if you want to share more than one
            machine with a user, invite users to your cylonix network instead.
          </p>
        </v-alert>

        <!-- Section 2: Email Input or Link Generation -->
        <v-sheet
          style="
            border: 1px solid rgb(var(--v-theme-primary));
            border-radius: 4px;
          "
          class="mb-4"
        >
          <v-tabs class="mt-2" v-model="tab" align-tabs="center">
            <v-tab value="email">Share via Email</v-tab>
            <v-tab value="link">Generate Invite Link</v-tab>
          </v-tabs>

          <v-tabs-window v-model="tab">
            <!-- Email Tab -->
            <v-tabs-window-item value="email">
              <v-card-text>
                <v-form @submit.prevent="confirmShare">
                  <v-text-field
                    v-model="emails"
                    label="Email Addresses"
                    placeholder="user1@example.com, user2@example.com"
                    :error-messages="
                      !isValid && emails
                        ? 'Please enter valid email addresses'
                        : ''
                    "
                    hint="Enter multiple emails separated by commas"
                    persistent-hint
                    class="mb-4"
                  />
                </v-form>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn
                  color="primary"
                  variant="elevated"
                  class="mb-4 me-4"
                  @click="confirmShare"
                  :loading="loading"
                  :disabled="loading || !isValid || !emails"
                  prepend-icon="mdi-share"
                >
                  Share
                </v-btn>
              </v-card-actions>
            </v-tabs-window-item>

            <!-- Link Tab -->
            <v-tabs-window-item value="link">
              <v-card-text>
                <v-form @submit.prevent="generateInviteLink">
                  <v-text-field
                    v-model="emails"
                    label="Email Addresses (for tracking)"
                    placeholder="user1@example.com, user2@example.com"
                    :error-messages="
                      !isValid && emails
                        ? 'Please enter valid email addresses'
                        : ''
                    "
                    hint="Enter emails to track who this link is for"
                    persistent-hint
                    class="mb-4"
                  />
                </v-form>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn
                  color="primary"
                  variant="elevated"
                  class="mb-4 me-4"
                  @click="generateInviteLink"
                  :loading="loading"
                  :disabled="loading || !isValid || !emails"
                  prepend-icon="mdi-link-variant"
                >
                  Generate Link
                </v-btn>
              </v-card-actions>
              <v-card-text v-if="inviteLink">
                <v-sheet class="pa-4" color="grey-lighten-4" rounded>
                  <div class="d-flex align-center">
                    <code class="text-body-2 flex-grow-1">{{
                      inviteLink
                    }}</code>
                    <v-tooltip text="Copy to clipboard" location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-content-copy"
                          variant="text"
                          @click="copyLink"
                        />
                      </template>
                    </v-tooltip>
                  </div>
                </v-sheet>
              </v-card-text>
            </v-tabs-window-item>
          </v-tabs-window>

          <!-- Section 3: Current Invites -->
          <v-card-title class="text-subtitle-1">
            Current Invites
            <v-btn
              icon="mdi-refresh"
              variant="text"
              size="small"
              @click="loadCurrentInvites"
              :loading="invitesLoading"
              class="ml-2"
            />
          </v-card-title>
          <v-card-text>
            <v-list v-if="currentInvites.length > 0" lines="two">
              <v-list-item v-for="invite in currentInvites" :key="invite.id">
                <template v-slot:prepend>
                  <v-icon>mdi-account-multiple</v-icon>
                </template>
                <v-list-item-title>
                  {{ invite.emails.join(', ') }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Invited by:
                  {{ invite.invitedBy.displayName || invite.invitedBy.email }} •
                  Created: {{ shortTs(invite.createdAt) }}
                  <br />
                  Code: {{ invite.code }}
                </v-list-item-subtitle>
                <template v-slot:append>
                  <div class="d-flex ga-1">
                    <v-tooltip
                      text="Delete invite and revoke access"
                      location="top"
                    >
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-delete"
                          variant="text"
                          size="small"
                          color="error"
                          @click="confirmDeleteInvite(invite)"
                        />
                      </template>
                    </v-tooltip>
                    <v-tooltip text="Resend invite" location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-email"
                          variant="text"
                          size="small"
                          color="primary"
                          @click="confirmResendInvite(invite)"
                        />
                      </template>
                    </v-tooltip>
                    <v-tooltip text="Copy invite link" location="top">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          v-bind="props"
                          icon="mdi-content-copy"
                          variant="text"
                          size="small"
                          color="info"
                          @click="copyInviteLink(invite)"
                          :disabled="!invite.link"
                        />
                      </template>
                    </v-tooltip>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <v-alert v-else type="info" variant="tonal">
              No invites for this node yet.
            </v-alert>
          </v-card-text>
        </v-sheet>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn class="mb-4 me-4" @click="dialog = false" :disabled="loading">
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Confirm Share Dialog -->
  <v-dialog v-model="showConfirmDialog" max-width="500">
    <v-card>
      <v-card-title>Confirm Share</v-card-title>
      <v-card-text>
        <p>
          Are you sure you want to share
          <strong>{{ node?.givenName }}</strong> with the following users?
        </p>
        <v-list class="mt-2">
          <v-list-item v-for="email in emailList" :key="email">
            <template v-slot:prepend>
              <v-icon>mdi-email</v-icon>
            </template>
            <v-list-item-title>{{ email }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <p class="text-caption text-grey mt-2">
          An email invitation will be sent to each user.
        </p>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="sendInvites" :loading="loading">
          Confirm
        </v-btn>
        <v-btn
          variant="text"
          @click="showConfirmDialog = false"
          :disabled="loading"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Invite Confirmation Dialog -->
  <ConfirmDialog
    v-model="showDeleteConfirm"
    title="Delete Invite"
    :text="deleteConfirmationText()"
    ok-text="Delete"
    ok-color="error"
    :loading="loading"
    @ok="deleteInvite"
  />

  <!-- Resend Invite Confirmation Dialog -->
  <ConfirmDialog
    v-model="showResendConfirm"
    title="Resend Invite"
    :text="`Are you sure you want to resend the invitation to ${selectedInvite?.emails.join(
      ', '
    )}?`"
    ok-text="Resend"
    ok-color="primary"
    :loading="loading"
    @ok="resendInvite"
  />
</template>

<style scoped>
code {
  word-break: break-all;
}

.v-btn.bg-primary {
  background-color: rgb(var(--v-theme-primary)) !important;
}
</style>
