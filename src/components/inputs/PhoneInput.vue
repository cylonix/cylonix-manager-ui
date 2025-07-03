<script setup lang="ts">
import isMobilePhone from 'validator/es/lib/isMobilePhone'
import { ref } from 'vue'

const emit = defineEmits(['change'])
const props = defineProps({ required: Boolean, requiredMessage: String })
const value = defineModel<string>()
const phoneRules = ref([
  (v: any) => {
    if (!v) {
      if (!props.required) {
        return true
      }
      return props.requiredMessage || 'Phone is required.'
    }
    // Default to US locale for now.
    return (
      isMobilePhone(v, 'en-US') ||
      'Phone number invalid. Example: 800-223-4567 or +1-800-223-4567'
    )
  },
])
</script>
<template>
  <AbstractNameInput
    v-model="value"
    :input-props="{
      autocomplete: 'tel',
      clearable: true,
      density: 'compact',
      rules: phoneRules,
      prependInnerIcon: 'mdi-phone-outline',
    }"
    label="Phone"
    :required="required"
    @change="emit('change')"
  >
  </AbstractNameInput>
</template>
