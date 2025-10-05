<!--
  Copyright (c) EZBLOCK INC. & AUTHORS
  SPDX-License-Identifier: BSD-3-Clause
-->

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const { mdAndUp } = useDisplay()

const props = defineProps({
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  loading: Boolean,
  maxWidth: {
    type: String,
  },
  minWidth: {
    type: String,
  },
  okDisabled: Boolean,
  okText: {
    type: String,
    default: 'OK',
  },
  okColor: {
    type: String,
    default: 'primary',
  },
  text: String,
  title: {
    type: String,
    default: 'Please confirm',
  },
})

const cardMinWidth = computed(() => {
  console.log('min', props.minWidth ?? (mdAndUp.value ? '600' : '300'))
  return props.minWidth ?? (mdAndUp.value ? '600' : '300')
})

const dialog = defineModel<boolean>()
const emit = defineEmits(['ok', 'cancel'])
function click(ok: boolean) {
  emit(ok ? 'ok' : 'cancel')
  if (!ok) {
    // Parent handles the dialog value in OK case.
    dialog.value = false
  }
}
</script>
<template>
  <v-dialog v-model="dialog" width="auto">
    <v-card :max-width="maxWidth" :min-width="cardMinWidth" :title="title">
      <v-divider></v-divider>
      <v-card-text v-if="text">{{ text }}</v-card-text>
      <v-card-item>
        <slot name="item"></slot>
      </v-card-item>
      <template v-slot:prepend>
        <v-icon color="primary" icon="mdi-alert-circle-outline"></v-icon>
      </template>
      <template v-slot:actions>
        <v-row class="mx-4 mb-4" justify="end">
          <v-btn
            :disabled="okDisabled"
            :loading="loading"
            min-width="100"
            :color="okColor"
            :text="okText"
            @click="click(true)"
          ></v-btn>
          <v-btn
            min-width="100"
            :text="cancelText"
            @click="click(false)"
          ></v-btn>
        </v-row>
      </template>
    </v-card>
  </v-dialog>
</template>
