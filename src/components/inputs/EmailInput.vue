<script setup lang="ts">
import isEmail from 'validator/es/lib/isEmail'
import { ref } from 'vue'
const emit = defineEmits(['change', 'submit'])
const props = defineProps({ required: Boolean, requiredMessage: String })
const value = defineModel<string>()
const rules = ref([
  (v: any) => {
    if (!v) {
      if (!props.required) {
        return true
      }
      return props.requiredMessage || 'Email is required.'
    }
    // Default to US locale for now.
    return isEmail(v) || 'Email invalid. Example: contact@cylonix.io'
  },
])
</script>
<template>
  <AbstractNameInput
    v-model="value"
    v-bind="$attrs"
    :input-props="{
      autocomplete: 'email',
      clearable: true,
      density: 'compact',
      rules: rules,
      prependInnerIcon: 'mdi-email-outline',
    }"
    input-ref="emailTextField"
    label="Email"
    :required="required"
    @change="emit('change')"
    @submit="emit('submit')"
  >
  </AbstractNameInput>
</template>
