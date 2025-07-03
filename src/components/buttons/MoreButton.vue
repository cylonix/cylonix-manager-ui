<script setup lang="ts">
const emit = defineEmits(['click'])
function click() {
  emit('click')
}
</script>
<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        class="mx-1"
        v-bind="props"
        icon="mdi-dots-horizontal"
        size="small"
        variant="text"
        @click="click"
      >
      </v-btn>
    </template>
    <span>More</span>
  </v-tooltip>
</template>
