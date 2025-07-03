<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { parse as parseJsonc } from 'jsonc-parser'
import { storeToRefs } from 'pinia'
import * as monaco from 'monaco-editor'
import type { Alert } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { newToast } from '@/plugins/toast'
import { usePolicyStore } from '@/stores/policy'
import { useUserStore } from '@/stores/user'

// Donot use ref for this. It will cause the editor to freeze.
// https://github.com/microsoft/monaco-editor/issues/3154
let editor: monaco.editor.IStandaloneCodeEditor | null = null

const theme = useTheme()
const alert = ref<Alert>({ on: false })
const loading = ref(false)
const editorContainer = ref<HTMLElement>()
const isDarkTheme = ref(theme.global.current.value.dark)
const isPolicyDifferentThanSaved = ref(false)
const savedPolicy = ref('')
const { policy } = storeToRefs(usePolicyStore())
const { namespace, user } = storeToRefs(useUserStore())

// Default policy template with comments
const defaultPolicy = `// Example/default ACLs for unrestricted connections.
{
	// Declare static groups of users. Use autogroups for all users or users with a specific role.
	// "groups": {
	//  	"group:example": ["alice@example.com", "bob@example.com"],
	// },

	// Define the tags which can be applied to devices and by which users.
	// "tagOwners": {
	//  	"tag:example": ["autogroup:admin"],
	// },

	// Define access control lists for users, groups, autogroups, tags,
	// Tailscale IP addresses, and subnet ranges.
	"acls": [
		// Allow all connections.
		// Comment this section out if you want to define specific restrictions.
		{"action": "accept", "src": ["*"], "dst": ["*:*"]},

		// Allow users in "group:example" to access "tag:example", but only from
		// devices that are running macOS and have enabled Tailscale client auto-updating.
		// {"action": "accept", "src": ["group:example"], "dst": ["tag:example:*"], "srcPosture":["posture:autoUpdateMac"]},
	],

	// Define postures that will be applied to all rules without any specific
	// srcPosture definition.
	// "defaultSrcPosture": [
	//      "posture:anyMac",
	// ],

	// Define device posture rules requiring devices to meet
	// certain criteria to access parts of your system.
	// "postures": {
	//      // Require devices running macOS, a stable Tailscale
	//      // version and auto update enabled for Tailscale.
	// 	"posture:autoUpdateMac": [
	// 	    "node:os == 'macos'",
	// 	    "node:tsReleaseTrack == 'stable'",
	// 	    "node:tsAutoUpdate",
	// 	],
	//      // Require devices running macOS and a stable
	//      // Tailscale version.
	// 	"posture:anyMac": [
	// 	    "node:os == 'macos'",
	// 	    "node:tsReleaseTrack == 'stable'",
	// 	],
	// },

	// Define users and devices that can use Tailscale SSH.
	"ssh": [
		// Allow all users to SSH into their own devices in check mode.
		// Comment this section out if you want to define specific restrictions.
		//{
		//	"action": "check",
		//	"src":    ["autogroup:member"],
		//	"dst":    ["autogroup:self"],
		//	"users":  ["autogroup:nonroot", "root"],
		//},
	],
	"derpMap": {
		"Regions": {
		},
	},

	// Test access rules every time they're saved.
	// "tests": [
	//  	{
	//  		"src": "alice@example.com",
	//  		"accept": ["tag:example"],
	//  		"deny": ["100.101.102.103:443"],
	//  	},
	// ],
}
`

const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  language: 'json',
  theme: theme.global.current.value.dark ? 'vs-dark' : 'vs',
  automaticLayout: true,
  minimap: { enabled: false },
  fontSize: 14,
  tabSize: 2,
  scrollBeyondLastLine: false,
  formatOnPaste: true,
  formatOnType: true,
}

async function initEditor() {
  const container = editorContainer.value
  if (!container) return

  console.log('Initializing Monaco editor...', policy.value)
  const monacoInstance = monaco.editor.create(container, {
    value: policy.value ?? defaultPolicy,
    ...editorOptions,
    theme: isDarkTheme.value ? 'vs-dark' : 'vs',
  })

  // Configure JSON language
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    allowComments: true,
    trailingCommas: 'ignore',
  })

  editor = monacoInstance

  // Set up content change listener
  editor.onDidChangeModelContent(() => {
    policy.value = monacoInstance.getValue()
  })
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value
  editor?.updateOptions({ theme: isDarkTheme.value ? 'vs-dark' : 'vs' })
}

// Update theme watcher
watch(
  () => theme.global.name.value,
  (globalTheme) => {
    const newDark = globalTheme === 'dark'
    // Sync local state with global theme if they differ
    if (isDarkTheme.value !== newDark) {
      isDarkTheme.value = newDark
    }
    // Update editor theme
    editor?.updateOptions({ theme: newDark ? 'vs-dark' : 'vs' })
  }
)

watch(
  [() => policy.value, () => savedPolicy.value],
  ([newPolicy, newSavedPolicy]) => {
    isPolicyDifferentThanSaved.value =
      newSavedPolicy != '' && newPolicy !== newSavedPolicy
  },
  { immediate: true }
)
async function loadPolicy() {
  loading.value = true
  try {
    const ret = await tryRequest(async () => {
      const response = await vpnAPI.headscaleServiceGetPolicy(
        namespace.value,
        user.value?.networkDomain
      )
      console.log('Get Policy:', response)
      if (!response || !response.data || !response.data.policy) {
        alert.value = {
          on: true,
          type: 'info',
          text: 'Policy has not been set yet. Using default policy.',
        }
        if (!policy.value) {
          policy.value = defaultPolicy
        }
        console.log('policy does not exist')
        return
      }
      alert.value = { on: false }
      savedPolicy.value = response.data.policy
      if (!policy.value) {
        console.log('policy is empty setting to saved policy')
        policy.value = savedPolicy.value
        editor?.setValue(savedPolicy.value)
      }
    })
    if (ret) {
      alert.value = ret
    }
  } finally {
    loading.value = false
  }
}

function validatePolicyFormat() {
  const errors: { error: number; offset: number; length: number }[] = []
  const parsedPolicy = parseJsonc(policy.value, errors, {
    allowTrailingComma: true,
    allowEmptyContent: false,
    disallowComments: false,
  })

  if (errors.length > 0) {
    // Format error messages with line numbers
    const errorMessages = errors
      .map((error) => {
        const beforeError = policy.value.substring(0, error.offset)
        const line = beforeError.split('\n').length
        const column = error.offset - beforeError.lastIndexOf('\n')

        // Map error codes to readable messages
        const errorMap: { [key: number]: string } = {
          1: 'Invalid symbol',
          2: 'Invalid number format',
          3: 'Property name expected',
          4: 'Value expected',
          5: 'Colon expected',
          6: 'Comma expected',
          7: 'Right bracket expected',
          8: 'Right brace expected',
          9: 'Invalid comment',
        }

        const errorMessage = errorMap[error.error] || 'Unknown error'
        return `Line ${line}, Column ${column}: ${errorMessage}`
      })
      .join('\n')

    throw new Error(`Invalid JSON format:\n${errorMessages}`)
  }

  if (!parsedPolicy) {
    throw new Error('Failed to parse policy: Empty or invalid content')
  }
}

async function savePolicy() {
  loading.value = true
  try {
    // Use JSONC parser instead of JSON.parse
    const ret = await tryRequest(async () => {
      console.log('Saving policy:', policy.value)
      validatePolicyFormat()

      const response = await vpnAPI.headscaleServiceSetPolicy({
        namespace: namespace.value,
        network: user.value?.networkDomain,
        policy: policy.value,
      })
      console.log('Set Policy:', response)
      newToast({
        on: true,
        color: 'green',
        text: `Successfully set policy for "${user.value?.networkDomain}"`,
      })
      alert.value = { on: false }
    })
    if (ret) {
      alert.value = ret
    }
  } finally {
    loading.value = false
  }
}

function discardChanges() {
  const contentToRestore = savedPolicy.value || defaultPolicy
  editor?.setValue(contentToRestore)
}

onMounted(() => {
  initEditor()
  loadPolicy()
})

onBeforeUnmount(() => {
  // Don't dispose. It will freeze the editor.
  editor?.dispose()
})
</script>

<template>
  <v-container fluid>
    <v-sheet class="mx-auto" border="0" elevation="0" maxWidth="1200">
      <v-row>
        <v-col cols="12">
          <v-card :theme="isDarkTheme ? 'dark' : 'light'">
            <v-card-title class="d-flex align-center">
              Security Policy Editor
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                class="mr-2"
                icon
                @click="toggleTheme"
                :title="
                  isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'
                "
              >
                <v-icon>
                  {{
                    isDarkTheme
                      ? 'mdi-white-balance-sunny'
                      : 'mdi-moon-waning-crescent'
                  }}
                </v-icon>
              </v-btn>
              <v-btn
                color="error"
                variant="outlined"
                class="mr-2"
                :disabled="!isPolicyDifferentThanSaved"
                @click="discardChanges"
                prepend-icon="mdi-undo"
              >
                Discard Changes
              </v-btn>
              <v-btn
                color="primary"
                :loading="loading"
                @click="savePolicy"
                prepend-icon="mdi-content-save"
              >
                Save Policy
              </v-btn>
            </v-card-title>

            <v-card-text class="text-subtitle-1">
              <strong>Note: This is a beta feature. Use with caution.</strong>
              Please make sure you have alternative methods to access your
              devices in case the policy breaks your connectivity over the mesh
              network.
            </v-card-text>
            <v-card-text class="text-subtitle-1">
              Edit the policy in JSON format. Comments are allowed. It is saved
              automatically as draft. To apply it, click the
              <strong>Save Policy</strong> button.
            </v-card-text>
            <v-alert
              v-if="isPolicyDifferentThanSaved"
              type="warning"
              class="mb-2"
            >
              The policy has been changed. Click the Save Policy button to apply
              the changes.
            </v-alert>
            <v-card-text>
              <Alert v-model="alert" />

              <div ref="editorContainer" class="mt-2 editor-container"></div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-sheet>
  </v-container>
</template>

<style scoped>
.editor-container {
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
  height: 80vh;
  width: 100%;
}

/* Add transition for theme changes */
:deep(.monaco-editor) {
  transition: background-color 0.3s ease;
}
</style>
