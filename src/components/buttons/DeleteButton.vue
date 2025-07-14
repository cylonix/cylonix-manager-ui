<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { ref } from 'vue'
defineProps(['addNote', 'confirmDeleteText', 'okDeleteDisabled', 'title'])
const emit = defineEmits(['delete', 'pre-delete'])
const note = defineModel<string>('note')
const deleteDialog = ref(false)
function clickDelete() {
  emit('pre-delete')
  deleteDialog.value = true
}
function okDelete() {
  emit('delete')
  deleteDialog.value = false
}
</script>
<template>
  <v-tooltip location="top">
    <template v-slot:activator="{ props }">
      <v-btn
        class="mx-1"
        v-bind="props"
        icon=" mdi-delete-outline"
        color="red"
        size="small"
        variant="plain"
        @click="clickDelete"
      >
      </v-btn>
    </template>
    <span>Delete</span>
  </v-tooltip>
  <ConfirmDialog
    v-model="deleteDialog"
    :okDisabled="okDeleteDisabled"
    :text="confirmDeleteText ?? 'Delete this request'"
    :title="title"
    @ok="okDelete"
    ><template v-slot:item>
      <slot name="delete-dialog"></slot>
      <NoteInput
        v-if="addNote"
        v-model="note"
        label="Deletion note"
      /> </template
  ></ConfirmDialog>
</template>
