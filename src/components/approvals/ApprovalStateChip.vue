<script setup lang="ts">
defineProps(['state'])
import { ApprovalState } from '@/clients/manager'
function getColor(state: any): string | undefined {
  switch (state) {
    case ApprovalState.Pending:
      return 'primary'
    case ApprovalState.Approved:
      return 'green'
    case ApprovalState.Rejected:
      return 'red'
  }
  return undefined
}
</script>
<template>
  <v-chip :color="getColor(state)">
    {{ state }}
  </v-chip>
</template>
