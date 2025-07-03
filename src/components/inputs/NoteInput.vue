<script setup lang="ts">
defineProps(['label'])
const emit = defineEmits(['change'])
const note = defineModel<string>()
</script>
<template>
  <v-text-field
    autocomplete="note"
    clearable
    density="compact"
    prepend-inner-icon="mdi-note"
    :label="label ?? 'Note'"
    v-model="note"
    @update:model-value="emit('change')"
  ></v-text-field>
</template>
