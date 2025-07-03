<script setup lang="ts">
const emit = defineEmits(['click'])
function click () {
  emit('click')
}
</script>
<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        class="mx-1"
        v-bind="props"
        icon="mdi-pencil"
        size="small"
        variant="plain"
        @click="click"
      >
      </v-btn>
    </template>
    <span>Edit</span>
  </v-tooltip>
</template>
