<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import type { Alert } from '@/plugins/alert'
import { tryRequest, userAPI } from '@/plugins/api'
import { logout } from '@/plugins/logout'
import { newToast } from '@/plugins/toast'
import { isMacOS, isMobile } from '@/plugins/utils'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { isNetworkOwner, namespace, user } = storeToRefs(store)

const router = useRouter()
const alert = ref<Alert>()
const opened = ref([0]) // Panel at index 0 will be expanded by default
const showConfirmDialog = ref(false)
const loading = ref(false)

function startDeletion() {
  showConfirmDialog.value = true
}
async function deleteUser() {
  loading.value = true
  const ret = await tryRequest(async () => {
    await userAPI.deleteUsers(namespace.value!, [user.value!.userID!])
    newToast({
      on: true,
      color: 'green',
      text: isNetworkOwner.value
        ? 'Network and account deletion successful.'
        : 'Account deletion successful.',
    })
    await logout(true)
    // Redirect to login or app
    if (isMobile()) {
      window.location.href = 'https://cylonix.io/app/login-complete'
    } else if (isMacOS()) {
      window.location.href = 'cylonixauth://app/login-complete'
    } else {
      router.push('/login')
    }
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}
const confirmText = computed(() => {
  return isNetworkOwner.value
    ? 'Are you sure you want to delete your network and account? This action cannot be undone.'
    : 'Are you sure you want to delete your account? This action cannot be undone.'
})
</script>

<template>
  <v-container>
    <Alert v-model="alert" />

    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card variant="text">
          <v-card-title class="text-h4 text-wrap text-error mb-6">
            Delete Your Cylonix {{ isNetworkOwner ? 'Network' : 'Account' }}
          </v-card-title>

          <v-card-text>
            <p v-if="isNetworkOwner" class="text-body-1 mb-4">
              Since you are the owner of the network, deleting your account will
              also delete the entire network and all associated data. This
              action is irreversible and will remove all nodes, users, and
              settings from our servers.
            </p>
            <p v-else class="text-body-1 mb-4">
              If you decide you don't want to continue using Cylonix, you can
              delete your account. This will remove all your data from our
              servers and remove you from your Cylonix network. Your deletion
              may not be successful if your network admin does not allow account
              deletions.
            </p>

            <v-alert color="warning" variant="tonal" class="mb-6">
              <strong>Important:</strong> This action cannot be undone. All data
              will be permanently deleted.
            </v-alert>

            <v-expansion-panels v-model="opened" class="mb-6">
              <v-expansion-panel v-if="isNetworkOwner">
                <v-expansion-panel-title>
                  What happens when I delete my network?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ul class="ml-4">
                    <li class="mb-2">
                      All node and user data will be permanently deleted from
                      our servers
                    </li>
                    <li class="mb-2">
                      All metadata associated with your network will be removed
                    </li>
                    <li class="mb-2">
                      Some data may remain in temporary storage (diagnostic
                      logs, backups) for up to 60 days
                    </li>
                    <li>
                      Your network configuration and settings cannot be
                      recovered
                    </li>
                  </ul>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  What data does Cylonix store that will be deleted?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p>
                    Cylonix stores only the essential metadata needed to operate
                    the service:
                  </p>
                  <ul class="ml-4">
                    <li>Email address</li>
                    <li>Full name</li>
                    <li>External account profile links</li>
                    <li>IP addresses needed for NAT traversal</li>
                  </ul>
                  <p class="mt-2">
                    All data handling complies with our privacy policy.
                  </p>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Can I use Cylonix again after deletion?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <p>Yes, you can start using Cylonix again by:</p>
                  <ul class="ml-4">
                    <li>Logging in with your preferred identity provider</li>
                    <li>
                      A new network will be automatically created upon login
                    </li>
                  </ul>
                  <v-alert
                    color="info"
                    variant="tonal"
                    density="comfortable"
                    class="mt-2"
                  >
                    Note: If you used passkey authentication on a device, the
                    specific device will need to re-authenticate after creating
                    a new account.
                  </v-alert>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <v-card-actions class="justify-center mt-6">
              <v-btn color="error" variant="flat" @click="startDeletion">
                Delete My Account{{ isNetworkOwner ? ' And Network' : '' }}
              </v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <ConfirmDialog
      :loading="loading"
      :okDisabled="loading"
      okColor="error"
      okText="Delete"
      :text="confirmText"
      v-model="showConfirmDialog"
      @ok="deleteUser"
    ></ConfirmDialog>
  </v-container>
</template>

<style scoped>
.v-expansion-panels {
  background: transparent;
}
</style>
