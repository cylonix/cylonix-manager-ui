<script setup lang="ts">
import { DateTime } from 'luxon'

defineProps(['history'])
function getTitle(item: any): string | undefined {
  if (item.updaterName) {
    return `${item.updaterName}:`
  }
}
function getSubtitle(item: any): string {
  const t = DateTime.fromSeconds(item.timestamp).toLocaleString(
    DateTime.DATETIME_SHORT
  )
  return `${t}: ${item.note}`
}
</script>
<template>
  <v-list-item
    lines="three"
    v-for="(item, index) in history"
    :key="index"
    :title="getTitle(item)"
    :subtitle="getSubtitle(item)"
  ></v-list-item>
</template>
