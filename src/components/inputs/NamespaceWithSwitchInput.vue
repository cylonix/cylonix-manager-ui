<script setup lang="ts">

const emit = defineEmits(['change'])
const namespace = defineModel<string>('namespace')
const namespaceType = defineModel<string>('namespaceType')

</script>
<template>
  <v-row justify="start"
    ><v-switch
      v-model="namespaceType"
      class="mx-4"
      color="primary"
      label="Enterprise user"
      true-value="enterprise"
      false-value="community"
    ></v-switch
  ></v-row>
  <NamespaceInput
    v-if="namespaceType == 'enterprise'"
    v-model="namespace"
    @change="emit('change')"
  />
</template>
