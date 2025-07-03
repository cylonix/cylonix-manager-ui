<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useUserStore } from '@/stores/user'

const store = useUserStore()
const { isSysAdmin } = storeToRefs(store)
</script>

<template>
  <v-row>
    <v-col cols="12">
      <TenantApprovals v-if="isSysAdmin" />
    </v-col>
    <v-col cols="12">
      <UserApprovals />
    </v-col>
    <v-col cols="12">
      <DeviceApprovals />
    </v-col>
  </v-row>
</template>
