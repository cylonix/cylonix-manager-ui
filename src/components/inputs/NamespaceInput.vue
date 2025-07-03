<script setup lang="ts">
defineProps<{
  checkAvailable?: boolean
}>()
const emit = defineEmits(['change'])
const namespace = defineModel<string>()

function change() {
  emit('change')
}
</script>
<template>
  <CompanyNameOrNamespaceInput
    v-model="namespace"
    :check="checkAvailable"
    check-tooltip="Check if enterprise ID is available"
    label="Enterprise ID"
    :max="30"
    :min="6"
    @change="change"
  >
  </CompanyNameOrNamespaceInput>
</template>
