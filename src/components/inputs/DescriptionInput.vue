<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['change'])
const description = defineModel<string>()
const props = defineProps(['autocomplete', 'label', 'required'])
const rules = ref([
  (v: any) => !props.required || !!v || props.label + ' is required',
  (v: any) =>
    (v && v.length >= 2 && v.length <= 100) ||
    props.label + ' must be between 2 and 30 characters.'
])
</script>
<template>
  <AbstractNameInput
    v-model="description"
    :input-props="{
      autocomplete: autocomplete,
      clearable: true,
      density: 'compact',
      rules: rules
    }"
    :label="label ?? 'Description'"
    :required="required"
    @change="emit('change')"
  >
  </AbstractNameInput>
</template>
