<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['change'])
const name = defineModel<string>()
const props = defineProps(['autocomplete', 'label', 'required', 'min', 'max'])
const rules = ref([
  (v: any) => !props.required || !!v || props.label + ' is required',
  (v: any) =>
    (!props.required && !v) ||
    (v && v.length >= (props.min ?? 2) && v.length <= (props.max ?? 30)) ||
    props.label +
      `[${v?.length ?? 0}] must be ` +
      (props.min && props.max == props.min
        ? `${props.min}`
        : `between ${props.min ?? 2} and ${props.max ?? 30}`) +
      ' characters.',
])
</script>
<template>
  <AbstractNameInput
    v-model="name"
    :input-props="{
      autocomplete: autocomplete,
      clearable: true,
      density: 'compact',
      rules: rules,
    }"
    :label="label"
    :required="required"
    @change="emit('change')"
  >
  </AbstractNameInput>
</template>
