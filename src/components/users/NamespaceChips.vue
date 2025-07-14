<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { TenantConfig } from '@/clients/manager/api'
import { useTenantsStore } from '@/stores/tenants'
const tenantsCache = useTenantsStore()
function tenant(namespace: string): TenantConfig {
  return tenantsCache.get(namespace) ?? <TenantConfig>{}
}
defineProps<{ namespaces: Array<string> }>()
</script>
<template>
  <v-chip-group column
    ><v-chip v-for="n in namespaces" :key="n">
      <span>{{ n }}</span>
      <v-menu class="mt-2" activator="parent">
        <v-card class="pt-4 px-2"
          ><v-data-table
            :items="[tenant(n)]"
            hide-default-footer
            hide-default-header
          >
            <template v-slot:bottom></template></v-data-table
        ></v-card>
      </v-menu> </v-chip
  ></v-chip-group>
</template>
