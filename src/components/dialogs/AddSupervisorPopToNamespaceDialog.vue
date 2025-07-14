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

const props = defineProps(['namespace', 'addPops'])
const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()
const { lgAndUp } = useDisplay()

const alert = ref<Alert>({ on: false })
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const selected = ref<Array<number>>([])

const ready = computed(() => {
  return selected.value.length > 0
})

async function add() {
  const popNames = props.addPops.filter((_: string, index: number) =>
    selected.value.some((i) => i == index)
  )
  if (popNames.length <= 0) {
    alert.value = <Alert>{ on: true, text: 'Please select a pop to apply.' }
    return
  }
  const ret = await tryRequest(async () => {
    loading.value = true
    await supPopAPI().popApply(props.namespace, <PopApplyInput>{
      pops: popNames,
    })
    newToast({
      on: true,
      color: 'green',
      text: `Added '${popNames}' to '${props.namespace}' successfully`,
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
    @ok="add"
    ><template v-slot:item>
      <Alert v-if="alert.on" :alert="alert"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
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
</template>
