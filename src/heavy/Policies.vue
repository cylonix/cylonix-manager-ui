<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import { parse as parseJsonc } from 'jsonc-parser'
import { storeToRefs } from 'pinia'
import { V1Node } from '@/clients/headscale/api'
import Alert from '@/components/alerts/Alert.vue'
import PolicyRulesTable from '@/components/vpn/PolicyRulesTable.vue'
import PolicyMatrix from '@/components/vpn/PolicyMatrix.vue'
import PolicyDerpMap from '@/components/vpn/PolicyDerpMap.vue'
import VpnConnectivityGraph from '@/components/vpn/VpnConnectivityGraph.vue'
import type { Alert as AlertType } from '@/plugins/alert'
import { tryRequest, vpnAPI } from '@/plugins/api'
import { pushSuccess } from '@/plugins/toast'
import { usePolicyStore } from '@/stores/policy'
import { useUserStore } from '@/stores/user'
import {
  mdiWhiteBalanceSunny,
  mdiMoonWaningCrescent,
  mdiPencil,
  mdiFileCompare,
  mdiUndo,
  mdiContentSave,
  mdiCodeJson,
  mdiFormatListBulleted,
  mdiGrid,
  mdiGraphOutline,
  mdiEarth,
} from '@mdi/js'

import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    return new editorWorker()
  },
}

type TabKey = 'editor' | 'rules' | 'matrix' | 'graph' | 'derp'

interface Highlight {
  src: string | null
  dst: string | null
  ruleIndex: number | null
}

// Do not use ref for the editor instance. It will cause the editor to freeze.
// https://github.com/microsoft/monaco-editor/issues/3154
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let diffEditor: monaco.editor.IStandaloneDiffEditor | null = null

const theme = useTheme()
const alert = ref<AlertType>({ on: false })
const loading = ref(false)
const editorContainer = ref<HTMLElement>()
const diffEditorContainer = ref<HTMLElement>()
const showDiff = ref(false)
const isDarkTheme = ref(theme.global.current.value.dark)
const isPolicyDifferentThanSaved = ref(false)
const savedPolicy = ref('')
const { policy } = storeToRefs(usePolicyStore())
const { isNetworkAdmin, namespace, user } = storeToRefs(useUserStore())
const nodes = ref<V1Node[]>()
const tab = ref<TabKey>('rules')
const highlight = ref<Highlight>({ src: null, dst: null, ruleIndex: null })

function setCellHighlight(src: string | null, dst: string | null) {
  highlight.value = { src, dst, ruleIndex: null }
}

function setRuleHighlight(index: number | null) {
  highlight.value = { ...highlight.value, ruleIndex: index }
}

function goToRule(index: number) {
  setRuleHighlight(index)
  tab.value = 'rules'
}

function clearHighlight() {
  highlight.value = { src: null, dst: null, ruleIndex: null }
}

async function loadNodes() {
  const uID = user.value?.userID
  if (!uID) {
    alert.value = { on: true, text: 'Missing user ID.' }
    return
  }
  const network = user.value?.networkDomain
  const forNamespace = namespace.value

  const ret = await tryRequest(async () => {
    const ret = await vpnAPI.headscaleServiceListNodes(
      isNetworkAdmin.value ? (network ? undefined : uID) : uID,
      [],
      forNamespace,
      network,
    )
    nodes.value = ret?.data.nodes ?? []
  })
  if (ret) alert.value = ret
}

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

function initEditor() {
  const container = editorContainer.value
  if (!container) return

  const monacoInstance = monaco.editor.create(container, {
    value: policy.value || defaultPolicy,
    ...editorOptions,
    theme: isDarkTheme.value ? 'vs-dark' : 'vs',
  })

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    allowComments: true,
    trailingCommas: 'ignore',
  })

  editor = monacoInstance
  editor.onDidChangeModelContent(() => {
    policy.value = monacoInstance.getValue()
  })
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value
  editor?.updateOptions({ theme: isDarkTheme.value ? 'vs-dark' : 'vs' })
  if (diffEditor) {
    diffEditor.dispose()
    if (showDiff.value) {
      setTimeout(() => initDiffEditor(), 100)
    }
  }
}

function toggleDiffView() {
  showDiff.value = !showDiff.value

  if (showDiff.value) {
    setTimeout(() => initDiffEditor(), 100)
  } else {
    diffEditor?.dispose()
    diffEditor = null
    if (editor) {
      editor.dispose()
      editor = null
    }
    setTimeout(() => initEditor(), 100)
  }
}

function initDiffEditor() {
  const container = diffEditorContainer.value
  if (!container) return

  const originalModel = monaco.editor.createModel(
    savedPolicy.value || defaultPolicy,
    'json',
  )
  const modifiedModel = monaco.editor.createModel(
    policy.value || defaultPolicy,
    'json',
  )

  diffEditor = monaco.editor.createDiffEditor(container, {
    theme: isDarkTheme.value ? 'vs-dark' : 'vs',
    automaticLayout: true,
    readOnly: true,
    renderSideBySide: true,
    minimap: { enabled: false },
  })

  diffEditor.setModel({ original: originalModel, modified: modifiedModel })
}

watch(
  () => theme.global.name.value,
  (globalTheme) => {
    const newDark = globalTheme === 'dark'
    if (isDarkTheme.value !== newDark) isDarkTheme.value = newDark
    editor?.updateOptions({ theme: newDark ? 'vs-dark' : 'vs' })
  },
)

watch(
  [() => policy.value, () => savedPolicy.value],
  ([newPolicy, newSavedPolicy]) => {
    isPolicyDifferentThanSaved.value =
      newSavedPolicy !== '' && newPolicy !== newSavedPolicy
  },
  { immediate: true },
)

async function loadPolicy() {
  loading.value = true
  try {
    const ret = await tryRequest(async () => {
      const response = await vpnAPI.headscaleServiceGetPolicy(
        namespace.value,
        user.value?.networkDomain,
      )
      if (!response || !response.data || !response.data.policy) {
        alert.value = {
          on: true,
          type: 'info',
          text: 'Policy has not been set yet. Using default policy.',
        }
        if (!policy.value) {
          policy.value = defaultPolicy
          editor?.setValue(defaultPolicy)
        }
        return
      }
      alert.value = { on: false }
      savedPolicy.value = response.data.policy
      if (!policy.value) {
        policy.value = savedPolicy.value
        editor?.setValue(savedPolicy.value)
      }
    })
    if (ret) alert.value = ret
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
    const errorMessages = errors
      .map((error) => {
        const beforeError = policy.value.substring(0, error.offset)
        const line = beforeError.split('\n').length
        const column = error.offset - beforeError.lastIndexOf('\n')
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
    const ret = await tryRequest(async () => {
      validatePolicyFormat()
      await vpnAPI.headscaleServiceSetPolicy({
        namespace: namespace.value,
        network: user.value?.networkDomain,
        policy: policy.value,
      })
      pushSuccess(
        `Successfully set policy for "${user.value?.networkDomain}"`,
      )
      alert.value = { on: false }
      await loadPolicy()
      if (showDiff.value) toggleDiffView()
    })
    if (ret) alert.value = ret
  } finally {
    loading.value = false
  }
}

function discardChanges() {
  const contentToRestore = savedPolicy.value || defaultPolicy
  editor?.setValue(contentToRestore)
  if (showDiff.value) toggleDiffView()
}

onMounted(() => {
  initEditor()
  loadPolicy()
  loadNodes()
})

onBeforeUnmount(() => {
  editor?.dispose()
  diffEditor?.dispose()
})
</script>

<template>
  <v-container fluid>
    <v-card :theme="isDarkTheme ? 'dark' : 'light'">
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        Security Policy
        <v-spacer />
        <v-btn
          variant="text"
          icon
          @click="toggleTheme"
          :title="
            isDarkTheme ? 'Switch to Light Theme' : 'Switch to Dark Theme'
          "
        >
          <v-icon
            :icon="isDarkTheme ? mdiWhiteBalanceSunny : mdiMoonWaningCrescent"
          />
        </v-btn>
        <v-btn
          v-if="tab === 'editor'"
          color="info"
          variant="outlined"
          :disabled="!isPolicyDifferentThanSaved"
          @click="toggleDiffView"
          :prepend-icon="showDiff ? mdiPencil : mdiFileCompare"
        >
          {{ showDiff ? 'Back to Editor' : 'View Diff' }}
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          :disabled="!isPolicyDifferentThanSaved"
          @click="discardChanges"
          :prepend-icon="mdiUndo"
        >
          Discard
        </v-btn>
        <v-btn
          color="primary"
          :loading="loading"
          @click="savePolicy"
          :prepend-icon="mdiContentSave"
        >
          Save Policy
        </v-btn>
      </v-card-title>

      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="rules" :prepend-icon="mdiFormatListBulleted">
          Rules
        </v-tab>
        <v-tab value="matrix" :prepend-icon="mdiGrid">Matrix</v-tab>
        <v-tab value="editor" :prepend-icon="mdiCodeJson">Editor</v-tab>
        <v-tab value="graph" :prepend-icon="mdiGraphOutline">Graph</v-tab>
        <v-tab value="derp" :prepend-icon="mdiEarth">DERP</v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text>
        <v-alert
          v-if="isPolicyDifferentThanSaved"
          type="warning"
          variant="tonal"
          class="mb-3"
          density="comfortable"
        >
          Local draft differs from the saved policy. Click <strong>Save
          Policy</strong> to apply, or <strong>Discard</strong> to revert.
        </v-alert>

        <Alert v-model="alert" />

        <!-- Editor: always mounted via v-show so Monaco container survives tab switches -->
        <div v-show="tab === 'editor'">
          <p class="text-subtitle-2 mb-2">
            <strong>Note: This is a beta feature.</strong> Make sure you have
            alternative access methods in case the policy breaks mesh
            connectivity. Edits are auto-saved as draft; click Save Policy to
            apply.
          </p>
          <div
            v-show="!showDiff"
            ref="editorContainer"
            class="mt-2 editor-container"
          />
          <div
            v-show="showDiff"
            ref="diffEditorContainer"
            class="mt-2 editor-container"
          />
        </div>

        <div v-show="tab === 'rules'">
          <PolicyRulesTable
            :policy="policy"
            :highlight-rule-index="highlight.ruleIndex"
            :highlight-src="highlight.src"
            :highlight-dst="highlight.dst"
            @select-rule="setRuleHighlight"
            @clear-highlight="clearHighlight"
          />
        </div>

        <div v-show="tab === 'matrix'">
          <PolicyMatrix
            :policy="policy"
            :highlight-src="highlight.src"
            :highlight-dst="highlight.dst"
            @select="setCellHighlight"
          />
        </div>

        <div v-if="tab === 'graph'">
          <VpnConnectivityGraph
            :loading="loading"
            :nodes="nodes ?? []"
            :policy="policy"
            :saved-policy="savedPolicy"
            :highlight-rule-index="highlight.ruleIndex"
            :highlight-src="highlight.src"
            :highlight-dst="highlight.dst"
            @navigate-to-rule="goToRule"
            @select-cell="setCellHighlight"
          />
        </div>

        <div v-show="tab === 'derp'">
          <PolicyDerpMap :policy="policy" />
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.editor-container {
  border: 1px solid var(--v-border-color);
  border-radius: 4px;
  height: 72vh;
  width: 100%;
}

:deep(.monaco-editor) {
  transition: background-color 0.3s ease;
}
</style>
