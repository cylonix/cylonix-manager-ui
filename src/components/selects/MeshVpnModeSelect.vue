<script setup lang="ts">
import { MeshVpnMode } from '@/clients/manager/api'
const value = defineModel<MeshVpnMode>()
const emit = defineEmits(['update:model-value'])
</script>
<template>
  <v-select
    v-model="value"
    :items="[MeshVpnMode.Policy, MeshVpnMode.Single, MeshVpnMode.Tenant]"
    :label="'Select mesh vpn mode'"
    chips
  >
    ></v-select
  >
</template>
