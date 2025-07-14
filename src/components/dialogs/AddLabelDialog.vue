<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed, ref } from 'vue'
import { VForm } from 'vuetify/components'
import { Label, LabelCategory } from '@/clients/manager/api'
import type { Alert } from '@/plugins/alert'
import { labelAPI, tryRequest } from '@/plugins/api'
import { newToast } from '@/plugins/toast'

const emit = defineEmits(['added'])
const dialog = defineModel<boolean>()

const alert = ref<Alert>({ on: false })
const category = ref<LabelCategory>()
const color = ref('')
const description = ref('')
const form = ref<InstanceType<typeof VForm>>()
const isFormValid = ref(false)
const loading = ref(false)
const name = ref('')
const scope = ref<string>()

const ready = computed(() => {
  return isFormValid.value
})

async function add() {
  const ret = await tryRequest(async () => {
    loading.value = true
    await labelAPI.createLabels([
      <Label>{
        name: name.value,
        scope: scope.value,
        category: category.value,
        color: color.value,
        description: description.value,
      },
    ])
    newToast({
      on: true,
      color: 'green',
      text: `Added label ${name.value} successfully.`,
    })
    // Remove dialog after success.
    dialog.value = false
    emit('added')
  })
  if (ret) {
    console.log('ret=', ret)
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
    :okDisabled="!ready"
    okText="Add"
    title="Add label"
    @ok="add"
    ><template v-slot:item>
      <Alert v-if="alert.on" :alert="alert" class="my-2"></Alert>
      <v-form ref="form" v-model="isFormValid" auto-complete="on">
        <v-row>
          <v-col :md="6" cols="12">
            <NameInput v-model="name" label="Label name" required></NameInput>
            <DescriptionInput
              v-model="description"
              label="Label description"
            ></DescriptionInput>
            <LabelCategorySelect v-model="category"></LabelCategorySelect>
          </v-col>
          <v-col :md="6" cols="12" align="center">
            <v-chip size="large" variant="plain">Select a label color</v-chip>
            <v-color-picker
              class="mb-4"
              v-model="color"
              canvas-height="120"
              elevation="8"
              hide-inputs
              show-swatches
            ></v-color-picker>
          </v-col>
        </v-row>
      </v-form>
    </template>
  </ConfirmDialog>
</template>
