<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { MeshVpnMode } from '@/clients/manager/api'
const value = defineModel<MeshVpnMode>()
const emit = defineEmits(['update:model-value'])
</script>
<template>
  <v-select
    v-model="value"
    density="compact"
    prepend-inner-icon="mdi-shield-account"
    :items="[MeshVpnMode.Policy, MeshVpnMode.Single, MeshVpnMode.Tenant]"
    :label="'Select mesh vpn mode'"
  >
    ></v-select
  >
</template>
