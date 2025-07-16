<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import isStrongPassword from 'validator/es/lib/isStrongPassword'
import { ref } from 'vue'
import type { PropType } from 'vue'
import type { VTextField } from 'vuetify/components'
type UnwrapReadonlyArray<A> = A extends Readonly<Array<infer I>> ? I : A
type ValidationRule = UnwrapReadonlyArray<VTextField['rules']>
defineProps({
  addRules: Array as PropType<ValidationRule[]>,
  autofocus: Boolean,
  label: {
    type: String,
    default: 'Password',
  },
  placeholder: String,
})
const emit = defineEmits(['change', 'submit'])
const password = defineModel<string>()

const passwordVisible = ref(false)
const rules = ref([
  (v: any) => !!v || 'Password is required',
  (v: any) =>
    (v && v.length >= 8) ||
    'Password length must be at least 8 characters long',
  (v: any) =>
    (v && isStrongPassword(v)) ||
    'Password must contain one digit from 0 to 9, one lowercase letter, ' +
      'one uppercase letter, one special character, no space, and it ' +
      'must be at least 8 characters long.',
])

const passwordTextField = ref<InstanceType<typeof VTextField>>()
function validate() {
  passwordTextField.value?.validate()
}
defineExpose({ validate })
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault()
    emit('submit')
  }
}

</script>
<template>
  <v-text-field
    v-model="password"
    :autofocus="autofocus"
    autocomplete="password"
    clearable
    density="compact"
    prepend-inner-icon="mdi-lock-outline"
    ref="passwordTextField"
    required
    :append-inner-icon="passwordVisible ? 'mdi-eye-off' : 'mdi-eye'"
    :label="label"
    :placeholder="placeholder"
    :rules="rules.concat(addRules as Array<any> || [])"
    :type="passwordVisible ? 'text' : 'password'"
    @click:append-inner="passwordVisible = !passwordVisible"
    @update:model-value="emit('change')"
    @keydown="onKeydown"
  ></v-text-field>
</template>
