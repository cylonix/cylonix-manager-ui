<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { shortTs } from '@/plugins/date'
import { useNoticeStore } from '@/stores/notices'

const { notices } = storeToRefs(useNoticeStore())

const headers = ref([
  { title: 'ID', key: 'id', value: (item: any) => shortID(item.id) },
  {
    title: 'Created At',
    key: 'createdAt',
    value: (item: any) => shortTs(item.createdAt * 1000),
  },
  { title: 'Enterprise ID', key: 'namespace' },
  { title: 'State', key: 'state' },
  { title: 'Level', key: 'level' },
  { title: 'Type', key: 'type' },
  {
    title: 'Message',
    key: 'message',
  },
  {
    title: 'History',
    key: 'data-table-expand',
  },
  { title: 'Actions', key: 'actions', sortable: false },
] as const)

function shortID(id?: string): string | undefined {
  return `${id?.substring(0, 13)}...`
}
function shortMessage(message?: string): string | undefined {
  const m = messageJson(message)
  if (m) {
    return m.message.substring(0, 12) + '...'
  }
  return message?.substring(0, 12) + '...'
}
function messageJson(message?: string) {
  if (message) {
    try {
      return JSON.parse(message)
    } catch (e) {
      //console.log('failed to parse message', message)
    }
  }
}
</script>
<template>
  <v-chip class="my-2" size="large">Server notifications</v-chip>
  <v-data-table :headers="headers" :items="notices">
    <template v-slot:expanded-row="{ item }">
      <History :history="item.history"> </History>
    </template>
    <template v-slot:item.message="{ item }">
      <v-chip>
        <span>{{ shortMessage(item.message) }}</span>
        <v-menu class="mt-2" activator="parent">
          <v-card class="pt-4 px-2"
            ><v-card-item
              ><v-data-table
                v-if="messageJson(item.message)"
                :items="[messageJson(item.message)]"
                hide-default-footer
              >
                <template v-slot:bottom></template></v-data-table
              ><v-card v-else variant="plain" max-width="300"
                ><v-card-text> {{ item.message }}</v-card-text></v-card
              ></v-card-item
            ></v-card
          >
        </v-menu>
      </v-chip></template
    >
  </v-data-table>
</template>
