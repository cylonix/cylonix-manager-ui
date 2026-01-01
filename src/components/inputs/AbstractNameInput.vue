<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { VTextField } from 'vuetify/components'
import type { Alert } from '@/plugins/alert'

defineOptions({
  inheritAttrs: false
})

const emit = defineEmits(['change', 'check', 'submit'])
const value = defineModel<string>()
const alert = defineModel<Alert>('alert')
const checkSuccess = defineModel<boolean>('checkSuccess')
const props = defineProps<{
  check?: boolean
  checkTooltip?: string
  inputProps?: any
  inputRef?: any
  label?: string
  max?: number
  min?: number
  required?: boolean
}>()

const rules = ref([
  (v: any) => props.required || !!v || `${props.label} is required.`,
  (v: any) => {
    const min = props.min ?? 2
    const max = props.max ?? 30
    return (
      (v && v.length >= min && v.length <= max) ||
      `${props.label} must be ${min} to ${max} characters.`
    )
  },
])

function updated() {
  checkSuccess.value = undefined
  alert.value = { on: false }
  textField.value?.resetValidation()
  emit('change')
}
const textField = ref<InstanceType<typeof VTextField>>()
function validate() {
  console.log(props.label, 'validating required=', props.required)
  textField.value?.validate()
}
watch(
  () => props.required,
  (newValue) => {
    console.log(props.label, 'new required value')
    validate()
  }
)
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('submit')
  }
}
</script>
<template>
  <Alert v-if="alert" :alert="alert"></Alert>
  <v-text-field
    v-model="value"
    v-bind="{ ...inputProps, ...$attrs }"
    :label="label"
    ref="textField"
    :required="required"
    :rules="inputProps.rules ?? rules"
    validate-on="submit"
    @update:model-value="updated"
    @keydown="onKeydown"
  >
    <template v-slot:append-inner>
      <CheckButton
        v-if="check"
        size="24"
        :success="checkSuccess"
        :tooltip="checkTooltip"
        :valid="textField && textField.isValid"
        @check="emit('check')"
      />
      <v-btn v-else size="24" variant="plain"></v-btn>
    </template>
  </v-text-field>
</template>
