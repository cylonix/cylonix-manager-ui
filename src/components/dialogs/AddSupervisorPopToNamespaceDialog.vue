<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'
import { VForm } from 'vuetify/components'
import { PopApplyInput } from '@/clients/supervisor/api'
import type { Alert } from '@/plugins/alert'
import { supPopAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const props = defineProps(['forNamespace', 'namespaces', 'addPops'])
const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const selected = ref<Array<number>>([])
const namespace = ref<string>(props.forNamespace)

const ready = computed(() => {
  return selected.value.length > 0 && namespace.value
})

async function add() {
  confirmDialog.value = false
  if (!namespace.value) {
    alert.value = <Alert>{ on: true, text: 'Namespace is not specified.' }
    return
  }
  const popNames = props.addPops.filter((_: string, index: number) =>
    selected.value.some((i) => i == index)
  )
  if (popNames.length <= 0) {
    alert.value = <Alert>{ on: true, text: 'Please select a pop to apply.' }
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await supPopAPI().popApply(namespace.value, <PopApplyInput>{
      pops: popNames,
    })
    newToast({
      on: true,
      color: 'green',
      text: `Added '${popNames}' to '${namespace.value}' successfully`,
    })
    // Remove dialog after success.
    dialog.value = false
    emit('added')
  })
  if (ret) {
    alert.value = ret
  }
  loading.value = false
}

const confirmAddText = computed(() => {
  const popNames = props.addPops.filter((_: string, index: number) =>
    selected.value.some((i) => i == index)
  )
  return `Add ${popNames.join(', ')} to '${namespace.value}'`
})
const confirmDialog = ref<boolean>(false)
function confirmAdd() {
  confirmDialog.value = true
}
</script>

<template>
  <ConfirmDialog
    v-model="dialog"
    :loading="loading"
    maxWidth="1000"
    :minWidth="lgAndUp ? '900' : '400'"
    :okDisabled="!ready"
    okText="Add"
    :title="`Add pop to ${namespace}`"
    @ok="confirmAdd"
    ><template v-slot:item>
      <Alert v-model="alert"></Alert>
      <v-form class="mt-4" ref="form" v-model="isFormValid" auto-complete="on">
        <v-select
          v-if="!forNamespace"
          v-model="namespace"
          :items="namespaces"
          label="Please select a namespace"
          required
        ></v-select>
        <v-chip-group
          v-model="selected"
          selected-class="text-primary"
          column
          mandatory
          multiple
        >
          <v-chip v-for="pop in addPops" :key="pop" filter :text="pop"></v-chip>
        </v-chip-group>
      </v-form>
    </template>
  </ConfirmDialog>
  <ConfirmDialog
    v-model="confirmDialog"
    :loading="loading"
    :okDisabled="false"
    okText="Add"
    :text="confirmAddText"
    title="Confirm adding gateway to a namespace"
    @ok="add"
  />
</template>
