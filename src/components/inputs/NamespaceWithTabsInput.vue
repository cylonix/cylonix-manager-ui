<script setup lang="ts">
const emit = defineEmits(['change'])
const namespace = defineModel<string>('namespace')
const namespaceType = defineModel<string>('namespaceType')
</script>
<template>
  <v-tabs
    class="mb-4"
    v-model="namespaceType"
    align-tabs="center"
    grow
    @update:model-value="emit('change')"
  >
    <v-tab
      value="enterprise"
      class="text-caption"
      text="Enterprise user"
    ></v-tab>
    <v-tab value="community" class="text-caption" text="Community user"></v-tab>
  </v-tabs>

  <v-tabs-window v-model="namespaceType">
    <v-tabs-window-item value="enterprise">
      <NamespaceInput v-model="namespace" @change="emit('change')" />
    </v-tabs-window-item>
    <v-tabs-window-item value="community"> </v-tabs-window-item>
  </v-tabs-window>
</template>
